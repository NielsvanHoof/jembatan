/**
 * Seed the A1 daily-life deck (and optional bootstrap user).
 * Run: npm run db:seed
 */
import "./load-env";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  A1_DAILY_NL_CARDS,
  A1_DAILY_NL_DECK,
} from "../src/data/seed-a1-daily-nl";
import { cards, decks, users } from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  console.log(`Seeding deck "${A1_DAILY_NL_DECK.slug}"…`);

  // Upsert deck by slug so re-running seed is safe for the deck row.
  const existingDeck = await db
    .select()
    .from(decks)
    .where(eq(decks.slug, A1_DAILY_NL_DECK.slug))
    .limit(1);

  let deckId: string;

  if (existingDeck[0]) {
    deckId = existingDeck[0].id;
    await db
      .update(decks)
      .set({
        titleId: A1_DAILY_NL_DECK.titleId,
        titleNl: A1_DAILY_NL_DECK.titleNl,
        descriptionId: A1_DAILY_NL_DECK.descriptionId,
      })
      .where(eq(decks.id, deckId));

    // Replace cards for a clean reseed of content.
    await db.delete(cards).where(eq(cards.deckId, deckId));
    console.log("Updated existing deck and cleared old cards.");
  } else {
    const [created] = await db
      .insert(decks)
      .values({
        slug: A1_DAILY_NL_DECK.slug,
        titleId: A1_DAILY_NL_DECK.titleId,
        titleNl: A1_DAILY_NL_DECK.titleNl,
        descriptionId: A1_DAILY_NL_DECK.descriptionId,
      })
      .returning();
    deckId = created.id;
    console.log("Created new deck.");
  }

  await db.insert(cards).values(
    A1_DAILY_NL_CARDS.map((card) => ({
      deckId,
      frontId: card.frontId,
      backNl: card.backNl,
      exampleId: card.exampleId ?? null,
      exampleNl: card.exampleNl ?? null,
      tags: card.tags,
    })),
  );

  console.log(`Inserted ${A1_DAILY_NL_CARDS.length} cards.`);

  // Optional bootstrap learner account from env.
  const seedEmail = process.env.SEED_USER_EMAIL?.toLowerCase().trim();
  const seedPassword = process.env.SEED_USER_PASSWORD;
  const seedName = process.env.SEED_USER_NAME ?? "Pembelajar";

  if (seedEmail && seedPassword) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, seedEmail))
      .limit(1);

    if (existingUser[0]) {
      console.log(`Seed user ${seedEmail} already exists — skipped.`);
    } else {
      const passwordHash = await hash(seedPassword, 12);
      await db.insert(users).values({
        email: seedEmail,
        passwordHash,
        name: seedName,
      });
      console.log(`Created seed user ${seedEmail}.`);
    }
  } else {
    console.log("No SEED_USER_EMAIL/PASSWORD — skip user bootstrap.");
  }

  await client.end();
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
