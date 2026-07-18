/**
 * Progress domain types (stats DTOs for the progress page).
 */

/** Aggregated study stats for one deck (optionally one direction). */
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
