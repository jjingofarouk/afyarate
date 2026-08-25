#!/usr/bin/env node
/**
 * Replaces the generated initials-on-gradient placeholder images (created by
 * add_post_images.mjs as a last resort) on the scholarship/grant/conference/
 * internship listings added on 2026-08-20 with real, relevant photos.
 *
 * Each source photo was found via the Openverse API (aggregates openly
 * licensed images, mostly Flickr), downloaded and visually inspected before
 * being added here, one candidate was rejected for showing a distressed
 * patient, another for prominent US flags/fire-department branding, both
 * unsuitable. Each is re-hosted in the `post-images` Supabase bucket (same
 * pattern as add_post_images.mjs / add_unsplash_listing_images.mjs) so the
 * site never hotlinks a third-party origin.
 *
 * Usage: node scripts/replace_new_opportunity_placeholders.mjs
 */
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
if (!url || !key || !dbUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY / SUPABASE_DB_URL");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

// One verified, CC-licensed photo per opportunity type (source: Openverse/Flickr).
const IMAGES = {
  scholarship: {
    src: "https://live.staticflickr.com/2563/4003040883_f0dfc4b7af.jpg",
    name: "scholarship-graduates",
  },
  grant: {
    src: "https://live.staticflickr.com/5498/9193047101_37177bd4df_b.jpg",
    name: "grant-laboratory",
  },
  conference: {
    src: "https://live.staticflickr.com/3174/2970115373_956e830d78_b.jpg",
    name: "conference-audience",
  },
  internship: {
    src: "https://live.staticflickr.com/48/180619560_393270497f_b.jpg",
    name: "internship-med-students",
  },
};

async function fetchWithTimeout(input, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function downloadImage(src) {
  const res = await fetchWithTimeout(src, { headers: { "User-Agent": UA } }, 30000);
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${src}`);
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!ct.startsWith("image/")) throw new Error(`not an image (${ct}) for ${src}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error(`empty download for ${src}`);
  return { buf, mime: ct };
}

async function uploadToBucket(filename, buf, mime) {
  const res = await fetchWithTimeout(
    `${url}/storage/v1/object/post-images/${filename}`,
    {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
      body: buf,
    },
    30000,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`upload ${res.status}: ${body.slice(0, 200)}`);
  }
  return `${url}/storage/v1/object/public/post-images/${filename}`;
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(
  `select id, type, title from public.posts
   where image_url like '%/post-images/%.svg' and type in ('scholarship','grant','conference','internship')
   order by type, id`,
);
console.log(`Found ${rows.length} listings with a generated placeholder to replace`);

const nonce = Date.now().toString(36);
const hostedUrlCache = new Map(); // type -> hosted Supabase public URL
let updated = 0;
let failed = 0;

for (const post of rows) {
  const photo = IMAGES[post.type];
  if (!photo) continue;
  try {
    let publicUrl = hostedUrlCache.get(post.type);
    if (!publicUrl) {
      const { buf, mime } = await downloadImage(photo.src);
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] ?? "jpg";
      const filename = `real-${photo.name}-${nonce}.${ext}`;
      publicUrl = await uploadToBucket(filename, buf, mime);
      hostedUrlCache.set(post.type, publicUrl);
    }
    await client.query(`update public.posts set image_url = $1, updated_at = now() where id = $2`, [
      publicUrl,
      post.id,
    ]);
    updated++;
    console.log(`  ✓ #${post.id} [${post.type}] ${post.title.slice(0, 55)}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ #${post.id} [${post.type}] ${post.title.slice(0, 55)}: ${e.message}`);
  }
}

await client.end();
console.log(`\nDone → updated: ${updated}, failed: ${failed}, unique photos hosted: ${hostedUrlCache.size}`);
