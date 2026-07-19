/**
 * Pure due-session selection: prefer seen cards, then a capped number of new ones.
 */

import { NEW_CARD_LIMIT, SESSION_CARD_LIMIT } from "@/lib/habit";

/** Minimal progress fields needed to decide seen vs fresh. */
export type SessionProgressPick = {
  lastReviewedAt: Date | null;
};

/**
 * Prefer already-seen due cards, then introduce a limited number of new ones.
 * Keeps early sessions from dumping the whole deck.
 */
export function pickSessionCards<T extends { progress: SessionProgressPick }>(
  rows: T[],
): T[] {
  const seen = rows.filter((row) => row.progress.lastReviewedAt != null);
  const fresh = rows.filter((row) => row.progress.lastReviewedAt == null);

  const picked: T[] = [];
  for (const row of seen) {
    if (picked.length >= SESSION_CARD_LIMIT) {
      break;
    }
    picked.push(row);
  }

  let newCount = 0;
  for (const row of fresh) {
    if (picked.length >= SESSION_CARD_LIMIT) {
      break;
    }
    if (newCount >= NEW_CARD_LIMIT) {
      break;
    }
    picked.push(row);
    newCount += 1;
  }

  return picked;
}
