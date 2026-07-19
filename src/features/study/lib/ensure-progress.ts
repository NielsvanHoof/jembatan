import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { cardProgress, cards, decks, type StudyDirection } from "@/db/schema";
import { initialSm2State } from "@/features/study/lib/sm2";
import type { StudyCard } from "@/features/study/types";

/**
 * Ensure every card in the deck has a progress row for this user+direction.
 * React.cache + primitive args: getDueCards and getHabitSummary both call this
 * in Promise.all — one ensure per (user, direction, deck) per request.
 */
export const ensureProgressRows = cache(
  async (userId: string, direction: StudyDirection, deckSlug: string) => {
    const [deck] = await db
      .select()
      .from(decks)
      .where(eq(decks.slug, deckSlug))
      .limit(1);

    if (!deck) {
      throw new Error(
        `Deck "${deckSlug}" belum di-seed. Jalankan npm run db:seed.`,
      );
    }

    const deckCards = await db
      .select({ id: cards.id })
      .from(cards)
      .where(eq(cards.deckId, deck.id));

    if (deckCards.length === 0) {
      return;
    }

    const existing = await db
      .select({ cardId: cardProgress.cardId })
      .from(cardProgress)
      .where(
        and(
          eq(cardProgress.userId, userId),
          eq(cardProgress.direction, direction),
        ),
      );

    const have = new Set(existing.map((row) => row.cardId));
    const missing = deckCards.filter((card) => !have.has(card.id));

    if (missing.length === 0) {
      return;
    }

    const fresh = initialSm2State();
    // dueAt uses the column default (now) — avoids Date binding quirks.
    // onConflictDoNothing: still needed if two directions race inserts, or if
    // cache is bypassed outside a shared React request tree.
    await db
      .insert(cardProgress)
      .values(
        missing.map((card) => ({
          userId,
          cardId: card.id,
          direction,
          easeFactor: fresh.easeFactor,
          intervalDays: fresh.intervalDays,
          repetitions: fresh.repetitions,
        })),
      )
      .onConflictDoNothing({
        target: [
          cardProgress.userId,
          cardProgress.cardId,
          cardProgress.direction,
        ],
      });
  },
);

/** Map a card + direction onto the front/back the learner sees. */
export function presentCard(
  card: typeof cards.$inferSelect,
  progress: typeof cardProgress.$inferSelect,
): StudyCard {
  const idToNl = progress.direction === "id_to_nl";
  return {
    progressId: progress.id,
    cardId: card.id,
    front: idToNl ? card.frontId : card.backNl,
    back: idToNl ? card.backNl : card.frontId,
    exampleFront: idToNl ? card.exampleId : card.exampleNl,
    exampleBack: idToNl ? card.exampleNl : card.exampleId,
    direction: progress.direction,
    tags: card.tags ?? [],
    // Sentence stage triggers word-by-word reveal in the study UI.
    stage: card.stage ?? "words",
  };
}
