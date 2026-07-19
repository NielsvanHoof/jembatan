"use server";

import { and, arrayContains, asc, eq, gt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress, cards, decks, type StudyDirection } from "@/db/schema";
import {
  DEFAULT_DECK_SLUG,
  getDeckTags,
  parseDeckSlug,
} from "@/features/study/lib/decks";
import {
  ensureProgressRows,
  presentCard,
} from "@/features/study/lib/ensure-progress";
import { pickSessionCards } from "@/features/study/lib/pick-session-cards";
import { loadStreakDays } from "@/features/study/lib/streak";
import {
  type StudyTagOption,
  toStudyTagOptions,
} from "@/features/study/lib/study-ui-copy";
import { parseStage } from "@/features/study/lib/themes";
import { studyDirectionSchema } from "@/features/study/schemas";
import type {
  CardStage,
  HabitSummary,
  StudyCard,
} from "@/features/study/types";
import {
  DAILY_REVIEW_GOAL,
  NEW_CARD_LIMIT,
  SESSION_CARD_LIMIT,
  startOfStudyDay,
} from "@/lib/habit";
import type { Locale } from "@/lib/i18n/dictionaries";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { requireUserId } from "@/lib/session";

export async function getDueCards(
  direction: StudyDirection,
  options?: {
    practiceAll?: boolean;
    limit?: number;
    tag?: string;
    /** Outing level: words (1) or sentences (2). */
    stage?: CardStage;
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
        // Outing level filter (words → sentences).
        options?.stage ? eq(cards.stage, options.stage) : undefined,
      ),
    )
    .orderBy(asc(cardProgress.dueAt))
    .limit(fetchLimit);

  const sessionRows = options?.practiceAll
    ? rows.slice(0, options.limit ?? SESSION_CARD_LIMIT)
    : pickSessionCards(rows);

  return sessionRows.map((row) => presentCard(row.card, row.progress));
}

/**
 * Habit numbers for one study direction + deck.
 * Due / next-due are deck (+ optional tag) scoped; today + streak stay global.
 */
export async function getHabitSummary(
  direction: StudyDirection,
  options?: { tag?: string; stage?: CardStage; deckSlug?: string },
): Promise<HabitSummary> {
  const userId = await requireUserId();
  const deckSlug = options?.deckSlug ?? DEFAULT_DECK_SLUG;
  await ensureProgressRows(userId, direction, deckSlug);

  const now = new Date();
  const dayStartIso = startOfStudyDay(now).toISOString();
  const tag = options?.tag;
  const stage = options?.stage;

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
        stage ? eq(cards.stage, stage) : undefined,
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
        stage ? eq(cards.stage, stage) : undefined,
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

/**
 * Soft-switch bundle for Study filters (including deck).
 * One round-trip: resolve deck → tags → due queue → habit.
 */
export async function loadStudySessionAction(options: {
  direction: StudyDirection;
  deckSlug?: string;
  tag?: string;
  stage?: CardStage;
  practiceAll?: boolean;
  /** Needed to localize tag chips without shipping the full tags map. */
  locale: Locale;
}): Promise<{
  deckSlug: string;
  tagOptions: StudyTagOption[];
  tag?: string;
  stage?: CardStage;
  cards: StudyCard[];
  habit: HabitSummary;
}> {
  await requireUserId();
  const locale = isLocale(options.locale) ? options.locale : "id";
  const studyDict = getDictionary(locale).study;
  const deckSlug = await parseDeckSlug(options.deckSlug);
  const deckTags = await getDeckTags(deckSlug);

  // Drop theme/stage filters that don't apply to the new deck.
  const tag =
    options.tag && deckTags.includes(options.tag) ? options.tag : undefined;
  // Outing themes default to words; non-outing clears stage.
  const stage = parseStage(options.stage, tag);

  const [cards, habit] = await Promise.all([
    getDueCards(options.direction, {
      practiceAll: options.practiceAll,
      tag,
      stage,
      deckSlug,
    }),
    getHabitSummary(options.direction, { tag, stage, deckSlug }),
  ]);

  return {
    deckSlug,
    tagOptions: toStudyTagOptions(studyDict, deckTags),
    tag,
    stage,
    cards,
    habit,
  };
}
