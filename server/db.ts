/*import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Prevent multiple pool/db instances during development (hot reloads)
const globalForDrizzle = globalThis as unknown as {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
};

export const pool =
  globalForDrizzle.pool ??
  new Pool({
    connectionString:
      "postgresql://neondb_owner:npg_rJ0c6vnBQHIV@ep-patient-hat-abrzz4ri-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
  });

export const db = globalForDrizzle.db ?? drizzle({ client: pool, schema });

if (process.env.NODE_ENV !== "production") {
  globalForDrizzle.pool = pool;
  globalForDrizzle.db = db;
} */