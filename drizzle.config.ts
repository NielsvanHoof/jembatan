import "./scripts/load-env";
import { defineConfig } from "drizzle-kit";

// Prefer Neon's direct (non-pooler) URL for migrate/generate when present.
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is required");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
