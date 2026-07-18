import { config } from "dotenv";

/** Load .env then .env.local (local wins) for CLI scripts / drizzle-kit. */
config({ path: ".env" });
config({ path: ".env.local", override: true });
