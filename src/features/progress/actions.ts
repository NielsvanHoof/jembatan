"use server";

import { and, asc, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress, cards, decks, type StudyDirection } from "@/db/schema";
import { DEFAULT_DECK_SLUG } from "@/features/study/lib/decks";
import { ensureProgressRows } from "@/features/study/lib/ensure-progress";
import { loadStreakDays } from "@/features/study/lib/streak";
import { DAILY_REVIEW_GOAL, startOfStudyDay } from "@/lib/habit";
import { requireUserId } from "@/lib/session";

export type ProgressStats = {
  dueNow: number;
  learning: number;
  mastered: number;
  totalCards: number;
  reviewedToday: number;
  /** Consecutive Amsterdam calendar days with at least one review. */
  streakDays: number;
  dailyGoal: number;
  /** Earliest future due time for this deck (any direction), if any. */
  nextDueAt: Date | null;
  lastStudiedAt: Date | null;
};

export async function getProgressStats(options?: {
  direction?: StudyDirection;
  deckSlug?: string;
}): Promise<ProgressStats> {
  const userId = await requireUserId();
  const deckSlug = options?.deckSlug ?? DEFAULT_DECK_SLUG;

  // Ensure both directions exist so totals stay meaningful.
  await ensureProgressRows(userId, "id_to_nl", deckSlug);
  await ensureProgressRows(userId, "nl_to_id", deckSlug);

  const now = new Date();
  const dayStart = startOfStudyDay(now);
  const nowIso = now.toISOString();
  const dayStartIso = dayStart.toISOString();

  const directionFilter = options?.direction
    ? eq(cardProgress.direction, options.direction)
    : undefined;

  const baseWhere = and(
    eq(cardProgress.userId, userId),
    eq(decks.slug, deckSlug),
    directionFilter,
  );

  const [totals] = await db
    .select({
      totalCards: sql<number>`count(*)::int`,
      dueNow: sql<number>`count(*) filter (where ${cardProgress.dueAt} <= ${nowIso})::int`,
      learning: sql<number>`count(*) filter (where ${cardProgress.repetitions} > 0 and ${cardProgress.repetitions} < 3)::int`,
      mastered: sql<number>`count(*) filter (where ${cardProgress.repetitions} >= 3)::int`,
      reviewedToday: sql<number>`count(*) filter (where ${cardProgress.lastReviewedAt} >= ${dayStartIso})::int`,
    })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(baseWhere);

  const [nextRow] = await db
    .select({ dueAt: cardProgress.dueAt })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cardProgress.userId, userId),
        eq(decks.slug, deckSlug),
        gt(cardProgress.dueAt, now),
      ),
    )
    .orderBy(asc(cardProgress.dueAt))
    .limit(1);

  const [lastRow] = await db
    .select({ lastReviewedAt: cardProgress.lastReviewedAt })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cardProgress.userId, userId),
        eq(decks.slug, deckSlug),
        isNotNull(cardProgress.lastReviewedAt),
      ),
    )
    .orderBy(desc(cardProgress.lastReviewedAt))
    .limit(1);

  // Streak stays global across decks (daily habit).
  const streakDays = await loadStreakDays(userId);

  return {
    dueNow: totals?.dueNow ?? 0,
    learning: totals?.learning ?? 0,
    mastered: totals?.mastered ?? 0,
    totalCards: totals?.totalCards ?? 0,
    reviewedToday: totals?.reviewedToday ?? 0,
    streakDays,
    dailyGoal: DAILY_REVIEW_GOAL,
    nextDueAt: nextRow?.dueAt ?? null,
    lastStudiedAt: lastRow?.lastReviewedAt ?? null,
  };
}
