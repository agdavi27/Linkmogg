// Runs pending SQL migrations. Skips quietly when no database is configured,
// so `next build` still works in environments without one.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const candidates = [process.env.DATABASE_URL_UNPOOLED, process.env.DATABASE_URL].filter(Boolean);
if (!candidates.length) {
  console.log("[migrate] DATABASE_URL not set, skipping migrations");
  process.exit(0);
}

const NETWORK = new Set(["ENETUNREACH", "EAFNOSUPPORT", "EADDRNOTAVAIL", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "EHOSTUNREACH", "CONNECT_TIMEOUT"]);

for (const [i, url] of candidates.entries()) {
  const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 15 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    console.log("[migrate] done");
    await sql.end();
    process.exit(0);
  } catch (e) {
    await sql.end({ timeout: 1 }).catch(() => {});
    const code = e?.cause?.code ?? e?.code;
    // Supabase's direct host (db.<ref>.supabase.co) is IPv6-only and unreachable from Vercel builds:
    // fall back to the pooled URL instead of failing the deploy.
    if (NETWORK.has(code) && i < candidates.length - 1) {
      console.warn(`[migrate] couldn't reach DATABASE_URL_UNPOOLED (${code}), trying DATABASE_URL`);
      continue;
    }
    throw e;
  }
}
