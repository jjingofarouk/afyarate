#!/usr/bin/env node
/**
 * Give every published listing an image, using curated Unsplash photos.
 *
 * add_post_images.mjs already tries each post's own source_url for a real
 * og:image before falling back to a placeholder. For the current batch of
 * imageless posts that fallback path doesn't help: they all come from
 * greatugandajobs.com (whose og:image is either a tiny employer logo or the
 * site-wide default_logo_company/defaultlogo.png shared by every anonymous
 * posting) or from this site's own domain (self-referential logo). Neither
 * is a usable listing photo.
 *
 * Instead, each post is classified by keywords in its title into a health
 * profession bucket (nurse, doctor/clinical, dentist, pharmacy, lab/research,
 * physiotherapy, radiography, counselling) or a generic office fallback, and
 * assigned one of a small set of hand-picked, individually content-verified
 * Unsplash photos for that bucket. Multi-photo buckets alternate
 * deterministically by post id so a long run of e.g. nurse listings doesn't
 * all show the exact same frame.
 *
 * Each distinct Unsplash photo is downloaded once and re-hosted in the
 * `post-images` Supabase bucket (same pattern as add_post_images.mjs /
 * curate_listing.mjs), then its public URL is reused for every post that
 * maps to it — so a 50-post run only uploads a dozen or so unique files.
 *
 * Usage:
 *   node scripts/add_unsplash_listing_images.mjs              # all imageless published posts
 *   node scripts/add_unsplash_listing_images.mjs --dry-run     # report classification without writing
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

// --- curated, individually content-verified Unsplash photos -----------------
// Each entry: Unsplash photo id (the hash after "photo-") + a short slug used
// only for the re-hosted filename. Verified by downloading and visually
// inspecting a preview crop of every id before adding it here — a couple of
// half-remembered ids that looked plausible turned out to be a dog and a
// hospital-branding photo of a real named Canadian hospital, both discarded.
const PHOTOS = {
  doctorA: { id: "1576091160399-112ba8d25d1d", name: "doctor-phone" },
  doctorB: { id: "1587351021355-a479a299d2f9", name: "doctor-surgeon" },
  doctorC: { id: "1550831107-1553da8c8464", name: "doctor-clipboard" },
  nurseA: { id: "1622253692010-333f2da6031d", name: "nurse-portrait" },
  nurseB: { id: "1584515979956-d9f6e5d09982", name: "nurse-injection" },
  dentistA: { id: "1588776814546-daab30f310ce", name: "dentist-procedure" },
  pharmacyA: { id: "1631549916768-4119b2e5f926", name: "pharmacy-blisters" },
  labA: { id: "1579154204601-01588f351e67", name: "lab-room" },
  labB: { id: "1532187863486-abf9dbad1b69", name: "lab-pipette" },
  physioA: { id: "1571019613454-1cb2f99b2d8b", name: "physio-exercise" },
  radiologyA: { id: "1666214280391-8ff5bd3c0bf0", name: "radiology-imaging" },
  counselorA: { id: "1573497019940-1c28c88b4f3e", name: "counselor-portrait" },
  officeA: { id: "1521737604893-d14cc237f11d", name: "office-generic" },
};

// Bucket -> ordered list of photo variants. Rows alternate across variants
// (by id) so a long run of the same bucket isn't visually identical.
const BUCKETS = {
  doctor: [PHOTOS.doctorA, PHOTOS.doctorB, PHOTOS.doctorC],
  nurse: [PHOTOS.nurseA, PHOTOS.nurseB],
  dentist: [PHOTOS.dentistA],
  pharmacy: [PHOTOS.pharmacyA],
  lab: [PHOTOS.labA, PHOTOS.labB],
  research: [PHOTOS.labB, PHOTOS.labA],
  physio: [PHOTOS.physioA],
  radiology: [PHOTOS.radiologyA],
  counselor: [PHOTOS.counselorA],
  office: [PHOTOS.officeA], // generic fallback for titles matching no profession keyword
};

// Order matters: more specific roles are checked before generic ones so e.g.
// "Pharmacy Assistant / Enrolled Nurse" lands on pharmacy, and "Research
// Assistant - Enrolled Nurse" lands on research, not nurse.
const CLASSIFIERS = [
  [/pharmac/i, "pharmacy"],
  [/dent(ist|al)/i, "dentist"],
  [/radiograph|imaging/i, "radiology"],
  [/laborator|phlebotom/i, "lab"],
  [/research|study coordinator/i, "research"],
  [/physiotherap|sports officer/i, "physio"],
  [/counsel/i, "counselor"],
  [/nurs(e|ing)|midwi/i, "nurse"],
  [
    /medical officer|clinical officer|physician|gynaecolog|gynecolog|p[ae]diatrician|clinic manager|clinic coordinator|team lead|ipc coordinator/i,
    "doctor",
  ],
];

function classify(title) {
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
  `select id, slug, type, title, organization
   from public.posts
   where status = 'published' and (image_url is null or image_url = '')
   order by id`,
);
console.log(`Found ${rows.length} published listings missing an image`);
if (!rows.length) {
  await client.end();
  process.exit(0);
}

const hostedUrlCache = new Map(); // photo id -> already-hosted Supabase public URL
const bucketCounts = {};
const nonce = Date.now().toString(36);

async function hostedUrlFor(photo) {
  const cached = hostedUrlCache.get(photo.id);
  if (cached) return cached;
  const { buf, mime } = await downloadUnsplash(photo.id);
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] ?? "jpg";
  const filename = `unsplash-${photo.name}-${nonce}.${ext}`;
  const publicUrl = dryRun ? `(dry-run) ${filename}` : await uploadToBucket(filename, buf, mime);
  hostedUrlCache.set(photo.id, publicUrl);
  return publicUrl;
}

let updated = 0;
let failed = 0;

for (const post of rows) {
  const bucket = classify(post.title);
  const variants = BUCKETS[bucket];
  const photo = variants[post.id % variants.length];
  const tag = `#${post.id} [${bucket}/${photo.name}] ${post.title.slice(0, 55)}`;
  bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
  try {
    const publicUrl = await hostedUrlFor(photo);
    if (!dryRun) {
      await client.query(
        `update public.posts set image_url = $1, updated_at = now() where id = $2`,
        [publicUrl, post.id],
      );
    }
    updated++;
    console.log(`  ✓ ${tag} -> ${publicUrl}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${tag}: ${e.message}`);
  }
}

await client.end();

console.log(`\nBucket distribution:`, bucketCounts);
console.log(
  `\nDone → updated: ${updated}, failed: ${failed}, unique photos hosted: ${hostedUrlCache.size}` +
    (dryRun ? " (dry run, nothing written)" : ""),
);
