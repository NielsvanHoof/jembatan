import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Shared Postgres client + Drizzle instance.
 * We cache on globalThis so hot reload does not open endless connections.
 */
const globalForDb = globalThis as unknown as {
  drizzleDb?: PostgresJsDatabase<typeof schema>;
};

export function getDb() {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, { max: 10 });
  const instance = drizzle(client, { schema });
  globalForDb.drizzleDb = instance;
  return instance;
}

/** Convenience export used throughout the app. */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    // Bind methods so Drizzle keeps the correct `this`.
    if (typeof value === "function") {
      return value.bind(getDb());
    }
    return value;
  },
});
