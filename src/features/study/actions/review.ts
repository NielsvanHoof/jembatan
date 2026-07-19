"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress } from "@/db/schema";
import { reviewSm2 } from "@/features/study/lib/sm2";
import { reviewCardInputSchema } from "@/features/study/schemas";
import type { StudyErrorCode } from "@/lib/i18n/dictionaries";
import { requireUserId } from "@/lib/session";

/** Apply one SM-2 rating to a progress row owned by the current user. */
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
