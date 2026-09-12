import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required but was not provided.");
}

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });

export * from "./schema";
