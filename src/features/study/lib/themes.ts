/**
 * Theme tag helpers for filtering the study queue.
 * Available tags come from the active deck (see getDeckTags).
 */

/**
 * “Today’s outing” shortcuts — shown first when the deck has them.
 */
export const OUTING_TAGS = ["ov", "belanja", "cafe", "arah"] as const;

export type OutingTag = (typeof OUTING_TAGS)[number];

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
] as const;

export type StudyTag = (typeof KNOWN_TAG_LABELS)[number] | (string & {});

const TAG_PATTERN = /^[a-z][a-z0-9-]*$/;

/** Parse `?tag=` query; invalid values are ignored (treat as all themes). */
export function parseTag(value: string | undefined): string | undefined {
  if (!value || !TAG_PATTERN.test(value)) {
    return undefined;
  }
  return value;
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
