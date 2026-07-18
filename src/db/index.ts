import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Shared Drizzle DB handle.
 * - Neon (Vercel): HTTP serverless driver
 * - Local Docker: postgres.js with a tiny pool
 */
type AppDb =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

const globalForDb = globalThis as unknown as {
  appDb?: AppDb;
};

function isNeonUrl(url: string) {
  return url.includes("neon.tech");
}

export function getDb(): AppDb {
  if (globalForDb.appDb) {
    return globalForDb.appDb;
  }

  const { DATABASE_URL } = getEnv();

  if (isNeonUrl(DATABASE_URL)) {
    // Neon HTTP — ideal for Vercel serverless isolates.
    const sql = neon(DATABASE_URL);
    globalForDb.appDb = drizzleNeon(sql, { schema });
  } else {
    // Local Docker / classic Postgres.
    const client = postgres(DATABASE_URL, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    globalForDb.appDb = drizzlePostgres(client, { schema });
  }

  return globalForDb.appDb;
}

/** Convenience export used throughout the app. */
export const db = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    if (typeof value === "function") {
      return value.bind(getDb());
    }
    return value;
  },
});
