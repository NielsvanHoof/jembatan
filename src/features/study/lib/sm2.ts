/**
 * SM-2 spaced repetition (Anki-style 4-button mapping).
 * Pure functions only — no DB — so we can reason about schedules easily.
 */

import type { Sm2Rating, Sm2Result, Sm2State } from "@/features/study/types";

const MIN_EASE = 1.3;

/** Map quality buttons onto the classic SM-2 0–5 scale. */
function ratingToQuality(rating: Sm2Rating): number {
  switch (rating) {
    case "again":
      return 0;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

/**
 * Compute the next SM-2 state after a review.
 * `now` is injected so tests (and seeds) stay deterministic.
 */
export function reviewSm2(
  current: Sm2State,
  rating: Sm2Rating,
  now: Date = new Date(),
): Sm2Result & { dueAt: Date } {
  const q = ratingToQuality(rating);
  let { easeFactor, intervalDays, repetitions } = current;

  // Failed recall: reset the learning streak; show again soon.
  if (q < 3) {
    repetitions = 0;
    intervalDays = 0;
    const dueAt = new Date(now);
    dueAt.setMinutes(dueAt.getMinutes() + 10);
    return {
      easeFactor,
      intervalDays,
      repetitions,
      dueInDays: 0,
      dueAt,
    };
  }

  // Ease update from SM-2.
  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  if (repetitions === 0) {
    intervalDays = rating === "easy" ? 4 : 1;
  } else if (repetitions === 1) {
    intervalDays = rating === "hard" ? 3 : rating === "easy" ? 7 : 6;
  } else {
    const multiplier =
      rating === "hard"
        ? 1.2
        : rating === "easy"
          ? easeFactor * 1.3
          : easeFactor;
    intervalDays = Math.max(1, Math.round(intervalDays * multiplier));
  }

  repetitions += 1;

  const dueAt = new Date(now);
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);
  // Keep time-of-day stable-ish; strip ms for cleaner storage.
  dueAt.setUTCMilliseconds(0);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueInDays: intervalDays,
    dueAt,
  };
}

/** Fresh progress row values before the first review. */
export function initialSm2State(): Sm2State {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
  };
}
