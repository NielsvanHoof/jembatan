CREATE TYPE "public"."card_stage" AS ENUM('words', 'sentences');--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "stage" "card_stage" DEFAULT 'words' NOT NULL;