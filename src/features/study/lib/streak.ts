import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress } from "@/db/schema";
import { calendarDayKey, computeStreakDays } from "@/lib/habit";

/** Consecutive Amsterdam calendar days with at least one review. */
export async function loadStreakDays(userId: string): Promise<number> {
  const reviewed = await db
    .select({ lastReviewedAt: cardProgress.lastReviewedAt })
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.userId, userId),
        isNotNull(cardProgress.lastReviewedAt),
      ),
    );

  const dayKeys = [
    ...new Set(
      reviewed
        .map((row) => row.lastReviewedAt)
        .filter((value): value is Date => value != null)
        .map((value) => calendarDayKey(value)),
    ),
  ].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  return computeStreakDays(dayKeys);
}
