#!/usr/bin/env node
/**
 * Give every published listing an image. For each post missing image_url:
 *   1. Fetch the source page and read its og:image / twitter:image.
 *   2. Download it and re-host in the `post-images` storage bucket.
 *   3. Fall back to a deterministic type-colored SVG placeholder when no
 *      (or an unusable) image is found, so no card is ever blank.
 * Then update image_url in the DB.
 *
 * Uploads use the publishable (anon) key, the bucket has an anon insert
 * policy, and rows are updated via SUPABASE_DB_URL since anon can't UPDATE.
 *
 * Usage:
 *   node scripts/add_post_images.mjs              # all imageless published posts
 *   node scripts/add_post_images.mjs --limit 3    # first 3 only
 *   node scripts/add_post_images.mjs --real-only  # skip placeholders
 *   node scripts/add_post_images.mjs --dry-run    # report without writing
 */
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const realOnly = args.includes("--real-only");
const dryRun = args.includes("--dry-run");
const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 12000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

if (!url || !key || !dbUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY / SUPABASE_DB_URL");
  process.exit(1);
}

// --- type -> placeholder gradient palette ---
const PALETTE = {
  job: ["#059669", "#0d9488"],         // emerald -> teal
  internship: ["#2563eb", "#4f46e5"],  // blue -> indigo
  scholarship: ["#f59e0b", "#ea580c"], // amber -> orange
  grant: ["#7c3aed", "#6d28d9"],       // violet -> purple
  fellowship: ["#e11d48", "#be185d"],  // rose -> pink
  conference: ["#0891b2", "#0e7490"],  // cyan -> sky
  opportunity: ["#65a30d", "#15803d"], // lime -> emerald
  other: ["#475569", "#334155"],       // slate -> gray
};

function placeholderSvg(post) {
  const [c1, c2] = PALETTE[post.type] ?? PALETTE.other;
  const initials = (post.organization || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .replace(/[&<>"']/g, "");
  const org = (post.organization || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="750" fill="url(#g)"/>
  <circle cx="1000" cy="80" r="260" fill="white" opacity="0.06"/>
  <circle cx="150" cy="650" r="200" fill="white" opacity="0.08"/>
  <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" opacity="0.92">${initials}</text>
  <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="white" opacity="0.85">${org}</text>
</svg>`;
}

async function fetchWithTimeout(input, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout ?? FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function absUrl(base, maybe) {
  try {
    return new URL(maybe, base).href;
  } catch {
    return null;
  }
}

/** Find og:image / twitter:image in raw HTML. */
function ogImageFromHtml(html, base) {
  const re = /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const c = m[0].match(/content=["']([^"']+)["']/i)?.[1];
    if (!c) continue;
    const u = absUrl(base, c);
    if (u && !u.startsWith("data:") && /\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(u)) return u;
  }
  return null;
}

async function scrapeImage(post) {
  if (!post.source_url) return null;
  let res;
  try {
    res = await fetchWithTimeout(post.source_url, { redirect: "follow", headers: { "User-Agent": UA } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return null;
  const html = await res.text().catch(() => "");
  return ogImageFromHtml(html, res.url || post.source_url);
}

async function downloadImage(imgUrl) {
  let res;
  try {
    res = await fetchWithTimeout(imgUrl, { redirect: "follow", headers: { "User-Agent": UA } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") ?? "";
  const cl = Number(res.headers.get("content-length")) || 0;
  if (!ct.startsWith("image/") || (cl > 0 && cl > MAX_IMAGE_BYTES)) return null;
  const buf = Buffer.from(await res.arrayBuffer().catch(() => new ArrayBuffer(0)));
  if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[ct.split(";")[0].trim()] ?? "jpg";
  return { buf, mime: ct.split(";")[0].trim(), ext };
}

async function uploadToBucket(filename, buf, mime) {
  const res = await fetchWithTimeout(`${url}/storage/v1/object/post-images/${filename}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
    body: buf,
    timeout: 30000,
  });
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
  `select id, slug, type, title, organization, source_url
   from public.posts
   where status = 'published' and (image_url is null or image_url = '')
   order by id`,
);
console.log(`Found ${rows.length} published posts missing an image`);
if (!rows.length) process.exit(0);

const toProcess = rows.slice(0, limit);
console.log(`Processing ${toProcess.length} (${dryRun ? "dry run" : "writing"})…`);

const imageCache = new Map(); // og:image URL -> already-hosted public URL
let real = 0, placeholder = 0, failed = 0, skipped = 0;
let idx = 0;

function uniqueName(post, ext) {
  const nonce = Date.now().toString(36);
  return `${post.slug}-${post.id}-${nonce}.${ext}`;
}

async function handle(post) {
  const tag = `#${post.id} ${post.title.slice(0, 45)}`;
  let publicUrl = null;
  let kind = null;
  let ogUrl = null;
  let payload = null; // { buf, mime, filename } once ready

  if (!realOnly) {
    const og = await scrapeImage(post);
    ogUrl = og;
    if (og) {
      const cached = imageCache.get(og);
      if (cached) {
        publicUrl = cached;
        kind = "real (cached)";
      } else {
        const img = await downloadImage(og);
        if (img) {
          payload = { buf: img.buf, mime: img.mime, filename: uniqueName(post, img.ext) };
          kind = "real";
        }
      }
    }
  }

  if (!payload) {
    if (realOnly) { skipped++; console.log(`  skip (real-only) ${tag}`); return; }
    payload = { buf: Buffer.from(placeholderSvg(post)), mime: "image/svg+xml", filename: uniqueName(post, "svg") };
    kind = "placeholder";
  }

  if (!dryRun) {
    if (!publicUrl) {
      publicUrl = await uploadToBucket(payload.filename, payload.buf, payload.mime);
      if (kind === "real" && ogUrl) imageCache.set(ogUrl, publicUrl);
    }
    await client.query(
      `update public.posts set image_url = $1, updated_at = now() where id = $2`,
      [publicUrl, post.id],
    );
  }
  if (kind === "real" || kind === "real (cached)") real++;
  else placeholder++;
  console.log(`  ${kind === "real" || kind === "real (cached)" ? "✓" : "◫"} ${kind.padEnd(14)} ${tag} -> ${(publicUrl ?? payload.filename).slice(-40)}`);
}

// small worker pool
const queue = [...toProcess];
async function worker() {
  while (queue.length) {
    const post = queue.shift();
    const i = ++idx;
    try {
      await handle(post);
    } catch (e) {
      failed++;
      console.log(`  ✗ failed ${post.title.slice(0, 40)}: ${e.message}`);
    }
  }
}

const started = Date.now();
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toProcess.length) }, worker));
await client.end();

console.log(
  `\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s → real: ${real}, ` +
  `placeholder: ${placeholder}, failed: ${failed}, skipped: ${skipped}` +
  (dryRun ? " (dry run, nothing written)" : ""),
);
