import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.pg) {
    globalForDb.pg = postgres(url, { prepare: false, max: process.env.NODE_ENV === "production" ? 3 : 10, connect_timeout: 10, idle_timeout: 20 });
  }
  return globalForDb.pg;
}

type DB = ReturnType<typeof drizzle<typeof schema>>;
let _db: DB | undefined;

/** Lazily connected so builds without DATABASE_URL still succeed. */
export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    if (!_db) _db = drizzle(client(), { schema });
    return Reflect.get(_db, prop);
  },
});

export * from "./schema";
