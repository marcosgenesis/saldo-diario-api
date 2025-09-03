import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/saldo-diario";

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
