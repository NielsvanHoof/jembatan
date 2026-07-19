/**
 * Import all YAML decks from content/decks into Postgres.
 * Run: npm run db:seed
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import "./load-env";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parse as parseYaml } from "yaml";
import { cards, decks, users } from "../src/db/schema";

/** Outing themes get Level 1 (words) then Level 2 (sentences). */
const OUTING_TAGS = new Set(["ov", "belanja", "cafe", "arah"]);

type CardStage = "words" | "sentences";

type DeckCard = {
  frontId: string;
  backNl: string;
  exampleId?: string;
  exampleNl?: string;
  tags: string[];
  /** Optional override; otherwise inferred for outing tags. */
  stage?: CardStage;
};

/**
 * Count whitespace-separated tokens (for sentence vs word heuristic).
 * Slash alternatives ("Bon / struk") use the shorter side so vocab stays Level 1.
 */
function tokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  // "Metro / kereta bawah tanah" → min(1, 3) = 1 → still a vocab card.
  if (trimmed.includes("/")) {
    return Math.min(...trimmed.split("/").map((part) => tokenCount(part)));
  }
  return trimmed.split(/\s+/).filter((part) => part.length > 0).length;
}

/**
 * Infer outing level from the card text.
 * Questions and longer lines become sentences; short vocab stays words.
 */
function inferStage(card: DeckCard): CardStage {
  if (card.stage === "words" || card.stage === "sentences") {
    return card.stage;
  }
  const hasOuting = (card.tags ?? []).some((tag) => OUTING_TAGS.has(tag));
  if (!hasOuting) {
    return "words";
  }
  const blob = `${card.frontId} ${card.backNl}`;
  if (/[?!]/.test(blob)) {
    return "sentences";
  }
  // Three or more tokens reads as a daily phrase, not a single word.
  if (tokenCount(card.backNl) >= 3 || tokenCount(card.frontId) >= 3) {
    return "sentences";
  }
  return "words";
}

type DeckFile = {
  slug: string;
  level: string;
  titleId: string;
  titleNl: string;
  descriptionId: string;
  cards: DeckCard[];
};

const DECKS_DIR = path.join(process.cwd(), "content/decks");

async function loadDeckFiles(): Promise<DeckFile[]> {
  const names = (await readdir(DECKS_DIR))
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort();

  const loaded: DeckFile[] = [];
  for (const name of names) {
    const raw = await readFile(path.join(DECKS_DIR, name), "utf8");
    const doc = parseYaml(raw) as DeckFile;
    if (!doc?.slug || !Array.isArray(doc.cards)) {
      throw new Error(`Invalid deck file: ${name}`);
    }
    loaded.push({
      slug: doc.slug,
      level: doc.level || "A1",
      titleId: doc.titleId,
      titleNl: doc.titleNl,
      descriptionId: doc.descriptionId,
      cards: doc.cards,
    });
  }
  return loaded;
}

async function upsertDeck(
  db: ReturnType<typeof drizzle>,
  deck: DeckFile,
): Promise<void> {
  console.log(`Seeding deck "${deck.slug}" (${deck.level})…`);

  const existingDeck = await db
    .select()
    .from(decks)
    .where(eq(decks.slug, deck.slug))
    .limit(1);

  let deckId: string;

  if (existingDeck[0]) {
    deckId = existingDeck[0].id;
    await db
      .update(decks)
      .set({
        level: deck.level,
        titleId: deck.titleId,
        titleNl: deck.titleNl,
        descriptionId: deck.descriptionId,
      })
      .where(eq(decks.id, deckId));

    // Replace cards for a clean reseed of content.
    await db.delete(cards).where(eq(cards.deckId, deckId));
    console.log("Updated existing deck and cleared old cards.");
  } else {
    const [created] = await db
      .insert(decks)
      .values({
        slug: deck.slug,
        level: deck.level,
        titleId: deck.titleId,
        titleNl: deck.titleNl,
        descriptionId: deck.descriptionId,
      })
      .returning();
    deckId = created.id;
    console.log("Created new deck.");
  }

  await db.insert(cards).values(
    deck.cards.map((card) => ({
      deckId,
      frontId: card.frontId,
      backNl: card.backNl,
      exampleId: card.exampleId ?? null,
      exampleNl: card.exampleNl ?? null,
      tags: card.tags ?? [],
      // Outing themes: words first, then daily sentences (word-by-word study).
      stage: inferStage(card),
    })),
  );

  console.log(`Inserted ${deck.cards.length} cards.`);
}

async function main() {
  // Prefer Neon direct URL when present (more reliable for bulk inserts).
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is required");
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  const deckFiles = await loadDeckFiles();
  if (deckFiles.length === 0) {
    throw new Error(`No YAML decks found in ${DECKS_DIR}`);
  }

  for (const deck of deckFiles) {
    await upsertDeck(db, deck);
  }

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
  console.log(`Seed complete (${deckFiles.length} decks).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
