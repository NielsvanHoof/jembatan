"use server";

import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress, cards, decks, type StudyDirection } from "@/db/schema";
import type { StudyErrorCode } from "@/lib/i18n/dictionaries";
import { requireUserId } from "@/lib/session";
import { initialSm2State, reviewSm2, type Sm2Rating } from "@/lib/sm2";

const DEFAULT_DECK_SLUG = "a1-kehidupan-sehari-hari";

export type StudyCard = {
  progressId: string;
  cardId: string;
  front: string;
  back: string;
  exampleFront?: string | null;
  exampleBack?: string | null;
  direction: StudyDirection;
  tags: string[];
};

export type ProgressStats = {
  dueNow: number;
  learning: number;
  mastered: number;
  totalCards: number;
  reviewedToday: number;
};

function isDirection(value: string): value is StudyDirection {
  return value === "id_to_nl" || value === "nl_to_id";
}

function isRating(value: string): value is Sm2Rating {
  return (
    value === "again" ||
    value === "hard" ||
    value === "good" ||
    value === "easy"
  );
}

/** Ensure every card in the default deck has a progress row for this user+direction. */
async function ensureProgressRows(userId: string, direction: StudyDirection) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.slug, DEFAULT_DECK_SLUG))
    .limit(1);

  if (!deck) {
    throw new Error("Deck belum di-seed. Jalankan npm run db:seed.");
  }

  const deckCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.deckId, deck.id));

  if (deckCards.length === 0) {
    return;
  }

  const existing = await db
    .select({ cardId: cardProgress.cardId })
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.userId, userId),
        eq(cardProgress.direction, direction),
      ),
    );

  const have = new Set(existing.map((row) => row.cardId));
  const missing = deckCards.filter((card) => !have.has(card.id));

  if (missing.length === 0) {
    return;
  }

  const fresh = initialSm2State();
  // dueAt uses the column default (now) — avoids Date binding quirks.
  await db.insert(cardProgress).values(
    missing.map((card) => ({
      userId,
      cardId: card.id,
      direction,
      easeFactor: fresh.easeFactor,
      intervalDays: fresh.intervalDays,
      repetitions: fresh.repetitions,
    })),
  );
}

/** Map a card + direction onto the front/back the learner sees. */
function presentCard(
  card: typeof cards.$inferSelect,
  progress: typeof cardProgress.$inferSelect,
): StudyCard {
  const idToNl = progress.direction === "id_to_nl";
  return {
    progressId: progress.id,
    cardId: card.id,
    front: idToNl ? card.frontId : card.backNl,
    back: idToNl ? card.backNl : card.frontId,
    exampleFront: idToNl ? card.exampleId : card.exampleNl,
    exampleBack: idToNl ? card.exampleNl : card.exampleId,
    direction: progress.direction,
    tags: card.tags ?? [],
  };
}

export async function getDueCards(
  direction: StudyDirection,
  options?: { practiceAll?: boolean; limit?: number },
): Promise<StudyCard[]> {
  const userId = await requireUserId();
  await ensureProgressRows(userId, direction);

  const limit = options?.limit ?? 40;
  const now = new Date();

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
        eq(decks.slug, DEFAULT_DECK_SLUG),
        options?.practiceAll ? sql`true` : lte(cardProgress.dueAt, now),
      ),
    )
    .orderBy(cardProgress.dueAt)
    .limit(limit);

  return rows.map((row) => presentCard(row.card, row.progress));
}

export async function reviewCardAction(input: {
  progressId: string;
  rating: string;
}): Promise<{ ok: true } | { ok: false; error: StudyErrorCode }> {
  const userId = await requireUserId();

  if (!isRating(input.rating)) {
    return { ok: false, error: "unknown_rating" };
  }

  const [row] = await db
    .select()
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.id, input.progressId),
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
    input.rating,
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

export async function getProgressStats(
  direction?: StudyDirection,
): Promise<ProgressStats> {
  const userId = await requireUserId();

  // Ensure both directions exist so totals stay meaningful.
  await ensureProgressRows(userId, "id_to_nl");
  await ensureProgressRows(userId, "nl_to_id");

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  // postgres.js can't bind Date inside sql`` fragments — use ISO strings.
  const nowIso = now.toISOString();
  const startOfDayIso = startOfDay.toISOString();

  const directionFilter = direction
    ? eq(cardProgress.direction, direction)
    : undefined;

  const baseWhere = and(eq(cardProgress.userId, userId), directionFilter);

  const [totals] = await db
    .select({
      totalCards: sql<number>`count(*)::int`,
      dueNow: sql<number>`count(*) filter (where ${cardProgress.dueAt} <= ${nowIso})::int`,
      learning: sql<number>`count(*) filter (where ${cardProgress.repetitions} > 0 and ${cardProgress.repetitions} < 3)::int`,
      mastered: sql<number>`count(*) filter (where ${cardProgress.repetitions} >= 3)::int`,
      reviewedToday: sql<number>`count(*) filter (where ${cardProgress.lastReviewedAt} >= ${startOfDayIso})::int`,
    })
    .from(cardProgress)
    .where(baseWhere);

  return {
    dueNow: totals?.dueNow ?? 0,
    learning: totals?.learning ?? 0,
    mastered: totals?.mastered ?? 0,
    totalCards: totals?.totalCards ?? 0,
    reviewedToday: totals?.reviewedToday ?? 0,
  };
}

export async function parseDirection(
  value: string | undefined,
): Promise<StudyDirection> {
  if (value && isDirection(value)) {
    return value;
  }
  return "id_to_nl";
}
