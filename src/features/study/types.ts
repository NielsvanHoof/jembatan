import type { StudyDirection } from "@/db/schema";

/** One flashcard as shown in a study session. */
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

/** Compact habit strip for the study page (dates as ISO for client props). */
export type HabitSummary = {
  dueNow: number;
  reviewedToday: number;
  streakDays: number;
  dailyGoal: number;
  nextDueAt: string | null;
};
