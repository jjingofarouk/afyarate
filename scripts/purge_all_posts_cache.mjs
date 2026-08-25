/**
 * One-off maintenance: purge the Cloudflare edge cache for every published
 * post by calling the admin PATCH endpoint with an empty patch (which also
 * bumps `updated_at`, harmless) so stale HTML is evicted immediately.
 *
 * Usage: node scripts/purge_all_posts_cache.mjs
 */
import pg from "pg";
import { createHmac } from "node:crypto";
import { loadEnv } from "./lib_env.mjs";

loadEnv();
const SITE_URL = process.env.SITE_URL || "https://ratemusawo.online";
const PASSCODE = process.env.ADMIN_PASSCODE;
if (!PASSCODE) throw new Error("ADMIN_PASSCODE missing");
if (!process.env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL missing");

// Sign an admin session cookie the same way lib/admin-auth.ts does.
const payload = `admin.${Date.now() + 7 * 24 * 60 * 60 * 1000}`;
const sig = createHmac("sha256", PASSCODE).update(payload).digest("hex");
const COOKIE = `musawo_admin_session=${payload}.${sig}`;

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
const { rows } = await client.query(
  `select id, slug from posts where status = 'published' order by id`
);
await client.end();
console.log(`Found ${rows.length} published posts`);

let ok = 0, fail = 0;
const CONCURRENCY = 5;
for (let i = 0; i < rows.length; i += CONCURRENCY) {
  const batch = rows.slice(i, i + CONCURRENCY);
  const results = await Promise.all(
    batch.map(async (row) => {
      try {
        const res = await fetch(`${SITE_URL}/api/admin/posts/${row.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            cookie: COOKIE,
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return true;
      } catch (err) {
        console.error(`FAIL ${row.slug}: ${err.message}`);
        return false;
      }
    })
  );
  ok += results.filter(Boolean).length;
  fail += results.filter((r) => !r).length;
  console.log(`Progress: ${Math.min(i + CONCURRENCY, rows.length)}/${rows.length}`);
}
console.log(`Done: ${ok} purged, ${fail} failed`);
