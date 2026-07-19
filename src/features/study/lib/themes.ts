/**
 * Theme tag helpers for filtering the study queue.
 * Available tags come from the active deck (see getDeckTags).
 *
 * Outing themes also have levels (words → sentences). See CardStage.
 */

import type {
  CardStage,
  KnownStudyTag,
  OutingTag,
} from "@/features/study/types";

/**
 * “Today’s outing” shortcuts — shown first when the deck has them.
 * Keep values in sync with OutingTag in types.ts.
 */
export const OUTING_TAGS = [
  "ov",
  "belanja",
  "cafe",
  "arah",
] as const satisfies readonly OutingTag[];

/** Known tag ids used for i18n labels (unknown tags show the raw id). */
export const KNOWN_TAG_LABELS = [
  "administrasi",
  "arah",
  "belanja",
  "beleefdheid",
  "cafe",
  "cuaca",
  "dasar",
  "kerja",
  "kesehatan",
  "kota",
  "makanan",
  "ov",
  "perkenalan",
  "rumah",
  "waktu",
] as const satisfies readonly KnownStudyTag[];

const TAG_PATTERN = /^[a-z][a-z0-9-]*$/;
const OUTING_SET = new Set<string>(OUTING_TAGS);

/** Parse `?tag=` query; invalid values are ignored (treat as all themes). */
export function parseTag(value: string | undefined): string | undefined {
  if (!value || !TAG_PATTERN.test(value)) {
    return undefined;
  }
  return value;
}

/** True when this theme shows Level 1 (words) / Level 2 (sentences). */
export function isOutingTag(tag: string | undefined): tag is OutingTag {
  return Boolean(tag && OUTING_SET.has(tag));
}

/**
 * Parse `?stage=` for outing themes.
 * Defaults to words when an outing tag is active; ignored otherwise.
 */
export function parseStage(
  value: string | undefined,
  tag: string | undefined,
): CardStage | undefined {
  if (!isOutingTag(tag)) {
    return undefined;
  }
  if (value === "sentences") {
    return "sentences";
  }
  // Level 1 is the default when filtering an outing theme.
  return "words";
}

/** Split a sentence into word tokens (punctuation stays on the word). */
export function splitSentenceWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
}

/** Split deck tags into outing shortcuts (ordered) + the rest. */
export function partitionDeckTags(deckTags: string[]): {
  outing: string[];
  other: string[];
} {
  const available = new Set(deckTags);
  const outing = OUTING_TAGS.filter((tag) => available.has(tag));
  const outingSet = new Set<string>(outing);
  const other = deckTags.filter((tag) => !outingSet.has(tag));
  return { outing, other };
}
