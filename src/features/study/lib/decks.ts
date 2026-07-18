/**
 * Deck helpers — slugs, listing, and query parsing.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import type { DeckSummary } from "@/features/study/types";

/** Fallback when `?deck=` is missing or unknown. */
export const DEFAULT_DECK_SLUG = "a1-kehidupan-sehari-hari";

/** All seeded decks, A1 before A2 then slug. */
export async function listDecks(): Promise<DeckSummary[]> {
  const rows = await db
    .select({
      slug: decks.slug,
      level: decks.level,
      titleId: decks.titleId,
      titleNl: decks.titleNl,
      descriptionId: decks.descriptionId,
    })
    .from(decks)
    .orderBy(asc(decks.level), asc(decks.slug));

  return rows;
}

export async function deckExists(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ slug: decks.slug })
    .from(decks)
    .where(eq(decks.slug, slug))
    .limit(1);
  return Boolean(row);
}

/**
 * Resolve `?deck=` to a known slug.
 * Unknown values fall back to the default A1 deck.
 */
export async function parseDeckSlug(
  value: string | undefined,
): Promise<string> {
  if (!value) {
    return DEFAULT_DECK_SLUG;
  }
  if (await deckExists(value)) {
    return value;
  }
  return DEFAULT_DECK_SLUG;
}

/** Distinct theme tags used by cards in this deck (sorted). */
export async function getDeckTags(deckSlug: string): Promise<string[]> {
  const rows = await db
    .select({ tags: cards.tags })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(eq(decks.slug, deckSlug));

  const set = new Set<string>();
  for (const row of rows) {
    for (const tag of row.tags ?? []) {
      if (tag) {
        set.add(tag);
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
