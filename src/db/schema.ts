import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Study direction: Indonesian front → Dutch back, or the reverse. */
export const studyDirectionEnum = pgEnum("study_direction", [
  "id_to_nl",
  "nl_to_id",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const decks = pgTable("decks", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  /** CEFR-ish level for the picker, e.g. A1 / A2 */
  level: text("level").notNull().default("A1"),
  titleId: text("title_id").notNull(),
  titleNl: text("title_nl").notNull(),
  descriptionId: text("description_id").notNull(),
});

/**
 * Outing theme levels: words first, then daily sentences.
 * Non-outing cards stay on "words" (stage filter is outing-only in the UI).
 */
export const cardStageEnum = pgEnum("card_stage", ["words", "sentences"]);

export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  /** Indonesian prompt / meaning */
  frontId: text("front_id").notNull(),
  /** Dutch translation */
  backNl: text("back_nl").notNull(),
  exampleId: text("example_id"),
  exampleNl: text("example_nl"),
  /** Theme tags like belanja, ov, cafe */
  tags: text("tags").array().notNull().default([]),
  /**
   * Level within an outing theme.
   * words = vocab / short phrases; sentences = daily lines (word-by-word reveal).
   */
  stage: cardStageEnum("stage").notNull().default("words"),
});

export const cardProgress = pgTable(
  "card_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    direction: studyDirectionEnum("direction").notNull(),
    /** SM-2 ease factor (starts at 2.5) */
    easeFactor: real("ease_factor").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("card_progress_user_card_direction").on(
      table.userId,
      table.cardId,
      table.direction,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(cardProgress),
}));

export const decksRelations = relations(decks, ({ many }) => ({
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  deck: one(decks, {
    fields: [cards.deckId],
    references: [decks.id],
  }),
  progress: many(cardProgress),
}));

export const cardProgressRelations = relations(cardProgress, ({ one }) => ({
  user: one(users, {
    fields: [cardProgress.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [cardProgress.cardId],
    references: [cards.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type CardProgress = typeof cardProgress.$inferSelect;
export type StudyDirection = (typeof studyDirectionEnum.enumValues)[number];
