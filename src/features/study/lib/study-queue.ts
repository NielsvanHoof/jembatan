/**
 * Pure study-session helpers: local queue advance, due copy, direction labels.
 * Kept free of React so unit tests can cover the rating path.
 */

import type { StudyDirection } from "@/db/schema";
import type { StudyUiCopy } from "@/features/study/lib/study-ui-copy";
import type { StudyCard } from "@/features/study/types";
import { nextDueLabel } from "@/lib/habit";

/** SM-2 rating keys shown in the study rating row. */
export const RATING_KEYS = ["again", "hard", "good", "easy"] as const;

export type StudyRating = (typeof RATING_KEYS)[number];

/**
 * Advance the in-memory queue after a rating.
 * "Again" requeues the card at the end; other ratings drop it.
 */
export function applyLocalQueue(
  prev: StudyCard[],
  current: StudyCard,
  rating: StudyRating,
): StudyCard[] {
  const [, ...rest] = prev;
  if (rating === "again") {
    return [...rest, current];
  }
  return rest;
}

/** Localized “next due” line for the empty/done state. */
export function formatNextDue(dict: StudyUiCopy, nextDueAt: string | null) {
  const label = nextDueLabel(nextDueAt ? new Date(nextDueAt) : null);
  if (!label) {
    return null;
  }
  if (label.kind === "now" || (label.kind === "hours" && label.hours <= 1)) {
    return dict.emptyNextDue.replace("{when}", dict.nextDueSoon);
  }
  if (label.kind === "hours") {
    return dict.emptyNextDue.replace(
      "{when}",
      dict.nextDueHours.replace("{n}", String(label.hours)),
    );
  }
  return dict.emptyNextDue.replace(
    "{when}",
    dict.nextDueDays.replace("{n}", String(label.days)),
  );
}

/** Compact ID ↔ NL label for the stage bar when filters are collapsed. */
export function directionShort(direction: StudyDirection) {
  return direction === "id_to_nl" ? "ID → NL" : "NL → ID";
}
