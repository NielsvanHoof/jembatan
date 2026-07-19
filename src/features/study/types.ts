/**
 * Study domain types (cards, habits, decks, SM-2, offline cache).
 * Pure type definitions — no Zod, no DB, no React.
 */

import type { StudyDirection } from "@/db/schema";

/**
 * Level inside an outing theme (OV, Belanja, Café, Arah).
 * words = vocab first; sentences = daily lines with word-by-word reveal.
 */
export type CardStage = "words" | "sentences";

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
  /** Outing level; sentence cards use word-by-word reveal. */
  stage: CardStage;
};

/** Compact habit strip for the study page (dates as ISO for client props). */
export type HabitSummary = {
  dueNow: number;
  reviewedToday: number;
  streakDays: number;
  dailyGoal: number;
  nextDueAt: string | null;
};

/** Deck row used in selectors / study chrome. */
export type DeckSummary = {
  slug: string;
  level: string;
  titleId: string;
  titleNl: string;
  descriptionId: string;
};

/** SM-2 button rating (Anki-style four grades). */
export type Sm2Rating = "again" | "hard" | "good" | "easy";

/** Current SM-2 scheduling state for one progress row. */
export type Sm2State = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

/** Next SM-2 state after a review, including due-in-days. */
export type Sm2Result = Sm2State & {
  /** Days until the card is due again (0 = same day / immediately). */
  dueInDays: number;
};

/**
 * “Today’s outing” shortcuts — must stay in sync with OUTING_TAGS in themes.ts.
 */
export type OutingTag = "ov" | "belanja" | "cafe" | "arah";

/** Known theme tag ids (unknown tags still allowed as plain strings). */
export type KnownStudyTag =
  | "administrasi"
  | "arah"
  | "belanja"
  | "beleefdheid"
  | "cafe"
  | "cuaca"
  | "dasar"
  | "kerja"
  | "kesehatan"
  | "kota"
  | "makanan"
  | "ov"
  | "perkenalan"
  | "rumah"
  | "waktu";

export type StudyTag = KnownStudyTag | (string & {});

/** Cached due-card session for offline study (IndexedDB). */
export type OfflineSession = {
  /** Composite key: day|deck|direction|tag|stage|practice */
  key: string;
  dayKey: string;
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  /** Outing level filter when the session was cached. */
  stage?: CardStage;
  practiceAll: boolean;
  cards: StudyCard[];
  habit: HabitSummary;
  savedAt: string;
};

/** Queued rating waiting to sync when the network returns. */
export type PendingReview = {
  id: string;
  progressId: string;
  rating: Sm2Rating;
  queuedAt: string;
};
