"use server";

import { and, arrayContains, asc, eq, gt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress, cards, decks, type StudyDirection } from "@/db/schema";
import { DEFAULT_DECK_SLUG } from "@/features/study/lib/decks";
import {
  ensureProgressRows,
  presentCard,
} from "@/features/study/lib/ensure-progress";
import { reviewSm2 } from "@/features/study/lib/sm2";
import { loadStreakDays } from "@/features/study/lib/streak";
import {
  reviewCardInputSchema,
  studyDirectionSchema,
} from "@/features/study/schemas";
import type { HabitSummary, StudyCard } from "@/features/study/types";
import {
  DAILY_REVIEW_GOAL,
  NEW_CARD_LIMIT,
  SESSION_CARD_LIMIT,
  startOfStudyDay,
} from "@/lib/habit";
import type { StudyErrorCode } from "@/lib/i18n/dictionaries";
import { requireUserId } from "@/lib/session";

/** Internal join shape for due-card selection — not part of the public domain API. */
type ProgressRow = {
  progress: typeof cardProgress.$inferSelect;
  card: typeof cards.$inferSelect;
};

/**
 * Prefer already-seen due cards, then introduce a limited number of new ones.
 * Keeps early sessions from dumping the whole deck.
 */
function pickSessionCards(rows: ProgressRow[]): ProgressRow[] {
  const seen = rows.filter((row) => row.progress.lastReviewedAt != null);
  const fresh = rows.filter((row) => row.progress.lastReviewedAt == null);

  const picked: ProgressRow[] = [];
  for (const row of seen) {
    if (picked.length >= SESSION_CARD_LIMIT) {
      break;
    }
    picked.push(row);
  }

  let newCount = 0;
  for (const row of fresh) {
    if (picked.length >= SESSION_CARD_LIMIT) {
      break;
    }
    if (newCount >= NEW_CARD_LIMIT) {
      break;
    }
    picked.push(row);
    newCount += 1;
  }

  return picked;
}

export async function getDueCards(
  direction: StudyDirection,
  options?: {
    practiceAll?: boolean;
    limit?: number;
    tag?: string;
    deckSlug?: string;
  },
): Promise<StudyCard[]> {
  const userId = await requireUserId();
  const deckSlug = options?.deckSlug ?? DEFAULT_DECK_SLUG;
  await ensureProgressRows(userId, direction, deckSlug);

  const now = new Date();
  // Practice mode can still be capped so a "review all" pass stays manageable.
  const fetchLimit = options?.practiceAll
    ? (options.limit ?? SESSION_CARD_LIMIT)
    : Math.max(SESSION_CARD_LIMIT, NEW_CARD_LIMIT) + 40;

  const rows = await db
    .select({
      progress: cardProgress,
      card: cards,
    })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cardProgress.userId, userId),
        eq(cardProgress.direction, direction),
        eq(decks.slug, deckSlug),
        options?.practiceAll ? sql`true` : lte(cardProgress.dueAt, now),
        // Theme filter: card tags array must contain the selected tag.
        options?.tag ? arrayContains(cards.tags, [options.tag]) : undefined,
      ),
    )
    .orderBy(asc(cardProgress.dueAt))
    .limit(fetchLimit);

  const sessionRows = options?.practiceAll
    ? rows.slice(0, options.limit ?? SESSION_CARD_LIMIT)
    : pickSessionCards(rows);

  return sessionRows.map((row) => presentCard(row.card, row.progress));
}

export async function reviewCardAction(input: {
  progressId: string;
  rating: string;
}): Promise<{ ok: true } | { ok: false; error: StudyErrorCode }> {
  const userId = await requireUserId();

  // Validate at the action boundary; keep SM-2 pure of string parsing.
  const parsed = reviewCardInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "unknown_rating" };
  }

  const [row] = await db
    .select()
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.id, parsed.data.progressId),
        eq(cardProgress.userId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false, error: "card_not_found" };
  }

  const next = reviewSm2(
    {
      easeFactor: row.easeFactor,
      intervalDays: row.intervalDays,
      repetitions: row.repetitions,
    },
    parsed.data.rating,
  );

  await db
    .update(cardProgress)
    .set({
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      lastReviewedAt: new Date(),
    })
    .where(eq(cardProgress.id, row.id));

  return { ok: true };
}

/**
 * Habit numbers for one study direction + deck.
 * Due / next-due are deck (+ optional tag) scoped; today + streak stay global.
 */
export async function getHabitSummary(
  direction: StudyDirection,
  options?: { tag?: string; deckSlug?: string },
): Promise<HabitSummary> {
  const userId = await requireUserId();
  const deckSlug = options?.deckSlug ?? DEFAULT_DECK_SLUG;
  await ensureProgressRows(userId, direction, deckSlug);

  const now = new Date();
  const dayStartIso = startOfStudyDay(now).toISOString();
  const tag = options?.tag;

  const [dueRow] = await db
    .select({ dueNow: sql<number>`count(*)::int` })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cardProgress.userId, userId),
        eq(cardProgress.direction, direction),
        eq(decks.slug, deckSlug),
        lte(cardProgress.dueAt, now),
        tag ? arrayContains(cards.tags, [tag]) : undefined,
      ),
    );

  const [todayRow] = await db
    .select({ reviewedToday: sql<number>`count(*)::int` })
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.userId, userId),
        sql`${cardProgress.lastReviewedAt} >= ${dayStartIso}`,
      ),
    );

  const [nextRow] = await db
    .select({ dueAt: cardProgress.dueAt })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cardProgress.userId, userId),
        eq(cardProgress.direction, direction),
        eq(decks.slug, deckSlug),
        gt(cardProgress.dueAt, now),
        tag ? arrayContains(cards.tags, [tag]) : undefined,
      ),
    )
    .orderBy(asc(cardProgress.dueAt))
    .limit(1);

  const streakDays = await loadStreakDays(userId);

  return {
    dueNow: dueRow?.dueNow ?? 0,
    reviewedToday: todayRow?.reviewedToday ?? 0,
    streakDays,
    dailyGoal: DAILY_REVIEW_GOAL,
    nextDueAt: nextRow?.dueAt?.toISOString() ?? null,
  };
}

export async function parseDirection(
  value: string | undefined,
): Promise<StudyDirection> {
  const parsed = studyDirectionSchema.safeParse(value);
  return parsed.success ? parsed.data : "id_to_nl";
}
