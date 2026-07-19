/**
 * Pure filter-resolution for soft study switches.
 * Owns deck/theme/stage rules so switchFilters stays thin and testable.
 */

import type { StudyDirection } from "@/db/schema";
import { isOutingTag } from "@/features/study/lib/themes";
import type { CardStage } from "@/features/study/types";

/** Current filter dims before applying a soft switch. */
export type StudyFilterState = {
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  stage?: CardStage;
  practiceAll: boolean;
};

/** Partial update from StudyFilters chips / empty-state CTAs. */
export type StudyFilterPatch = {
  deckSlug?: string;
  direction?: StudyDirection;
  /** null clears the theme; undefined means “keep current”. */
  tag?: string | null;
  /** null clears the stage; undefined means “derive from rules”. */
  stage?: CardStage | null;
  practiceAll?: boolean;
};

/** Resolved dims ready for optimistic UI + server load. */
export type ResolvedStudyFilters = {
  deckSlug: string;
  direction: StudyDirection;
  tag?: string;
  stage?: CardStage;
  practiceAll: boolean;
  /** True when nothing changed — caller should no-op. */
  unchanged: boolean;
};

/**
 * Resolve next deck / theme / stage / direction / practice dims.
 * New deck drops theme. Outing themes keep a level; switching outing
 * theme (or deck) resets to Level 1 (words).
 */
export function resolveStudyFilters(
  current: StudyFilterState,
  next: StudyFilterPatch,
): ResolvedStudyFilters {
  const nextDeck = next.deckSlug ?? current.deckSlug;
  const nextDirection = next.direction ?? current.direction;
  const deckChanged = nextDeck !== current.deckSlug;

  // New deck drops theme; clearing theme uses null; otherwise keep.
  const nextTag = deckChanged
    ? undefined
    : next.tag === null
      ? undefined
      : (next.tag ?? current.tag);

  // Outing themes keep a level; clearing the theme drops it.
  // Switching outing theme (or deck) resets to Level 1 (words).
  let nextStage: CardStage | undefined;
  if (!isOutingTag(nextTag)) {
    nextStage = undefined;
  } else if (next.stage) {
    nextStage = next.stage;
  } else if (
    deckChanged ||
    (next.tag !== undefined && next.tag !== current.tag)
  ) {
    nextStage = "words";
  } else {
    nextStage = current.stage ?? "words";
  }

  const nextPracticeAll = next.practiceAll ?? current.practiceAll;

  const unchanged =
    nextDeck === current.deckSlug &&
    nextDirection === current.direction &&
    nextTag === current.tag &&
    nextStage === current.stage &&
    nextPracticeAll === current.practiceAll;

  return {
    deckSlug: nextDeck,
    direction: nextDirection,
    tag: nextTag,
    stage: nextStage,
    practiceAll: nextPracticeAll,
    unchanged,
  };
}
