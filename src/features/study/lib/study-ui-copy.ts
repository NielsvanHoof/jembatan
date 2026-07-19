/**
 * Slim study strings for the client island.
 * Tags / deck labels are resolved on the server into option lists instead.
 */

import type { DeckSummary } from "@/features/study/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Deck chip: slug + already-localized label. */
export type StudyDeckOption = {
  slug: string;
  label: string;
};

/** Theme chip: tag id + already-localized label. */
export type StudyTagOption = {
  tag: string;
  label: string;
};

/** Study copy without the bulk tag/deck label maps. */
export type StudyUiCopy = Omit<Dictionary["study"], "tags" | "deckLabels">;

/** Drop unused label maps before crossing the RSC → client boundary. */
export function toStudyUiCopy(study: Dictionary["study"]): StudyUiCopy {
  const { tags: _tags, deckLabels: _deckLabels, ...copy } = study;
  return copy;
}

/** Resolve deck picker options once on the server (or in a server action). */
export function toStudyDeckOptions(
  study: Dictionary["study"],
  decks: DeckSummary[],
): StudyDeckOption[] {
  return decks.map((deck) => ({
    slug: deck.slug,
    label:
      study.deckLabels[deck.slug as keyof typeof study.deckLabels] ?? deck.slug,
  }));
}

/** Resolve theme chips for the active deck’s tags only. */
export function toStudyTagOptions(
  study: Dictionary["study"],
  tags: string[],
): StudyTagOption[] {
  return tags.map((tag) => ({
    tag,
    label: study.tags[tag as keyof typeof study.tags] ?? tag,
  }));
}
