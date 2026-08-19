#!/usr/bin/env node
/**
 * Replace the generic gradient-placeholder SVG (from the old
 * add_post_images.mjs fallback) with a real, curated Unsplash photo on every
 * published post that still has one, spans all listing types, not just
 * jobs (fellowships, grants, scholarships, "other" training programs, etc).
 *
 * Classification is type-aware:
 *   - scholarship          -> education bucket
 *   - grant                -> funding/partnership bucket
 *   - other                -> training/workshop bucket
 *   - fellowship           -> research bucket, unless the title says
 *                             "clinical sub-specialty" (then -> doctor)
 *   - job / opportunity    -> same keyword classifier as
 *                             add_unsplash_listing_images.mjs, extended with
 *                             admin/program/data/epidemiology keywords
 *
 * Most buckets reuse photos already uploaded (and content-verified) by
 * add_unsplash_listing_images.mjs, passed in as REUSED_URLS below, so this
 * script only downloads+uploads the handful of genuinely new photos. Every
 * new photo id was fetched at full resolution and visually inspected before
 * being added here (see conversation history, a prior mislabeling mistake
 * during batch verification is why this one re-checks each id individually
 * instead of trusting a remembered label).
 *
 * Usage:
 *   node scripts/replace_placeholder_images.mjs             # all published posts with a placeholder svg
 *   node scripts/replace_placeholder_images.mjs --dry-run    # report only
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

const dryRun = process.argv.includes("--dry-run");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

// Already live in the post-images bucket, content-verified against the
// deployed file itself (not just the Unsplash source) after the earlier
// batch. Reused here so equivalent categories don't re-upload duplicates.
const BASE = `${url}/storage/v1/object/public/post-images`;
const REUSED = {
  doctor: [`${BASE}/unsplash-doctor-phone-msygkqsq.jpg`, `${BASE}/unsplash-doctor-or-msyhcsgn.jpg`, `${BASE}/unsplash-doctor-clipboard-msygkqsq.jpg`],
  nurse: [`${BASE}/unsplash-nurse-portrait-msygkqsq.jpg`, `${BASE}/unsplash-nurse-injection-msygkqsq.jpg`],
  dentist: [`${BASE}/unsplash-dentist-procedure-msygkqsq.jpg`],
  pharmacy: [`${BASE}/unsplash-pharmacy-blisters-msygkqsq.jpg`],
  lab: [`${BASE}/unsplash-lab-room-msygkqsq.jpg`, `${BASE}/unsplash-lab-pipette-msygkqsq.jpg`],
  research: [`${BASE}/unsplash-lab-pipette-msygkqsq.jpg`, `${BASE}/unsplash-lab-room-msygkqsq.jpg`],
  physio: [`${BASE}/unsplash-physio-exercise-msygkqsq.jpg`],
  radiology: [`${BASE}/unsplash-radiology-imaging-msygkqsq.jpg`],
  counselor: [`${BASE}/unsplash-counselor-portrait-msygkqsq.jpg`],
  office: [`${BASE}/unsplash-office-generic-msygkqsq.jpg`],
};

// New photos this batch needs, downloaded once, re-hosted, then reused.
const NEW_PHOTOS = {
  education: { id: "1523240795612-9a054b0db644", name: "education-library" },
  training: { id: "1531482615713-2afd69097998", name: "training-workshop" },
  grant: { id: "1454165804606-c3d57bc86b40", name: "grant-planning" },
};

const CLASSIFIERS = [
  [/pharmac/i, "pharmacy"],
  [/dent(ist|al)/i, "dentist"],
  [/radiograph|imaging/i, "radiology"],
  [/laborator|phlebotom/i, "lab"],
  [/research|study coordinator|epidemiolog/i, "research"],
  [/physiotherap|sports officer/i, "physio"],
  [/counsel/i, "counselor"],
  [/nurs(e|ing)|midwi/i, "nurse"],
  [
    /medical officer|clinical officer|physician|gynaecolog|gynecolog|p[ae]diatrician|clinic manager|clinic coordinator|team lead|ipc coordinator/i,
    "doctor",
  ],
  // Admin/program-type roles common among fellowship-adjacent job posts, // no dedicated photo category, generic office/collaboration reads fine.
  [
    /dean\b|program (manager|officer)|administrat|data (officer|manager)|community mobili[sz]|education and registration|nutrition|food safety/i,
    "office",
  ],
];

function classify(type, title) {
  if (type === "scholarship") return "education";
  if (type === "grant") return "grant";
  if (type === "other") return "training";
  if (type === "fellowship") {
    return /clinical sub-specialt/i.test(title) ? "doctor" : "research";
  }
  for (const [re, bucket] of CLASSIFIERS) {
    if (re.test(title)) return bucket;
  }
  return "office";
}

async function fetchWithTimeout(input, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function downloadUnsplash(photoId) {
  const src = `https://images.unsplash.com/photo-${photoId}?w=1600&q=80&auto=format&fit=crop`;
  const res = await fetchWithTimeout(src, { headers: { "User-Agent": UA } }, 30000);
  if (!res.ok) throw new Error(`download failed (${res.status}) for photo-${photoId}`);
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!ct.startsWith("image/")) throw new Error(`not an image (${ct}) for photo-${photoId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error(`empty download for photo-${photoId}`);
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

// --- main ---
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(
  `select id, slug, type, title
   from public.posts
   where status = 'published' and image_url ilike '%.svg'
   order by id`,
);
console.log(`Found ${rows.length} published posts still using the gradient placeholder`);
if (!rows.length) {
  await client.end();
  process.exit(0);
}

// Upload new photos once, up front.
const nonce = Date.now().toString(36);
const newUrls = {};
for (const [bucket, photo] of Object.entries(NEW_PHOTOS)) {
  const { buf, mime } = await downloadUnsplash(photo.id);
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] ?? "jpg";
  const filename = `unsplash-${photo.name}-${nonce}.${ext}`;
  const publicUrl = dryRun ? `(dry-run) ${filename}` : await uploadToBucket(filename, buf, mime);
  newUrls[bucket] = [publicUrl];
  console.log(`Uploaded new ${bucket} photo -> ${publicUrl}`);
}

const URLS = { ...REUSED, ...newUrls };
const bucketCounts = {};
let updated = 0;
let failed = 0;

for (const post of rows) {
  const bucket = classify(post.type, post.title);
  const variants = URLS[bucket];
  if (!variants) {
    failed++;
    console.log(`  ✗ #${post.id} no photo pool for bucket "${bucket}" (${post.title})`);
    continue;
  }
  const chosenUrl = variants[post.id % variants.length];
  bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
  try {
    if (!dryRun) {
      await client.query(
        `update public.posts set image_url = $1, updated_at = now() where id = $2`,
        [chosenUrl, post.id],
      );
    }
    updated++;
    console.log(`  ✓ #${post.id} [${post.type}/${bucket}] ${post.title.slice(0, 55)} -> ${chosenUrl.slice(-45)}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ #${post.id} failed: ${e.message}`);
  }
}

await client.end();
console.log(`\nBucket distribution:`, bucketCounts);
console.log(`\nDone → updated: ${updated}, failed: ${failed}` + (dryRun ? " (dry run)" : ""));
