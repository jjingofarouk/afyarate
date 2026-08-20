#!/usr/bin/env node
/**
 * Rapid indexing via the Google Indexing API.
 * Usage: node scripts/rapid_index.mjs [--dry-run]
 *
 * Google officially documents this API for JobPosting / BroadcastEvent pages
 * only. Rate Musawo's /posts/[slug] pages already carry JobPosting structured
 * data (lib/jobPosting.ts), so job/opportunity posts are the intended,
 * fully-supported use case here, not a workaround. They're prioritized first:
 * newest posts first (a listing's value decays toward its deadline, and
 * getting it indexed within hours instead of weeks matters), then a small
 * set of evergreen static pages if quota remains. Practitioner and facility
 * pages are deliberately NOT submitted through this API, that's outside
 * Google's documented scope for it and the sitemap (already fixed to be
 * fast and reliable) is the right channel for that much larger set of pages.
 *
 * One-time setup required before this will run (can't be done from here,
 * needs your own Google account):
 *   1. Create a Google Cloud project, enable the "Web Search Indexing API".
 *   2. Create a service account in that project, download its JSON key,
 *      save it as service-accounts.json in the project root (gitignored).
 *   3. In Search Console (ratemusawo.online property) > Settings > Users and
 *      permissions > Add user, add the service account's email
 *      (…@…iam.gserviceaccount.com, found in the JSON key) as an Owner.
 *   4. Google's default quota is 200 URL submissions per day per project.
 */
import { google } from "googleapis";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib_env.mjs";

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://ratemusawo.online";
const KEY_FILE = path.resolve(__dirname, "..", "service-accounts.json");
const CACHE_FILE = path.resolve(__dirname, "..", ".rapid-index-cache.json");
const DAILY_QUOTA = 200;
const DRY_RUN = process.argv.includes("--dry-run") || process.argv.includes("--dry");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    return raw.date === todayKey() ? new Set(raw.urls) : new Set();
  } catch {
    return new Set();
  }
}

function saveCache(urls) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ date: todayKey(), urls: [...urls] }, null, 2));
}

// Evergreen high-value pages, submitted only once quota for fresh posts is spoken for.
const STATIC_URLS = [
  SITE,
  `${SITE}/jobs`,
  `${SITE}/internships`,
  `${SITE}/scholarships`,
  `${SITE}/grants`,
  `${SITE}/fellowships`,
  `${SITE}/conferences`,
  `${SITE}/practitioners`,
  `${SITE}/facilities`,
  `${SITE}/ambulances`,
];

async function fetchPriorityPostUrls(limit) {
  // Newest first, published status only, capped well above the daily quota
  // so there's always a fresh pool even if some rows lack a slug.
  const { data, error } = await supabase
    .from("posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((p) => p.slug)
    .map((p) => `${SITE}/posts/${p.slug}`);
}

async function main() {
  console.log("━".repeat(60));
  console.log(`Rapid index  [${DRY_RUN ? "DRY RUN" : "LIVE"}]  ${new Date().toISOString()}`);
  console.log("━".repeat(60));

  const cache = loadCache();
  const postUrls = await fetchPriorityPostUrls(DAILY_QUOTA);
  const candidates = [...postUrls, ...STATIC_URLS].filter((u) => !cache.has(u));

  console.log(`Post URLs available: ${postUrls.length}`);
  console.log(`Already submitted today: ${cache.size}`);
  console.log(`Fresh candidates this run: ${candidates.length}`);

  const batch = candidates.slice(0, DAILY_QUOTA);
  if (batch.length === 0) {
    console.log("Nothing left to submit today.");
    return;
  }

  if (DRY_RUN) {
    console.log("\nWould submit:");
    batch.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    return;
  }

  if (!fs.existsSync(KEY_FILE)) {
    console.error(`\nservice-accounts.json not found at ${KEY_FILE}.`);
    console.error("See the setup steps in this script's header comment. Cannot submit without it.");
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const authClient = await auth.getClient();
  const indexing = google.indexing({ version: "v3", auth: authClient });

  const submitted = new Set(cache);
  let ok = 0, failed = 0;

  for (const url of batch) {
    try {
      await indexing.urlNotifications.publish({ requestBody: { url, type: "URL_UPDATED" } });
      console.log(`  OK    ${url}`);
      submitted.add(url);
      ok++;
    } catch (err) {
      console.error(`  FAIL  ${url}: ${err.message}`);
      failed++;
      if (err.message.toLowerCase().includes("quota")) {
        console.log("Daily quota exceeded, stopping.");
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  saveCache(submitted);
  console.log(`\nDone. Submitted: ${ok}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("CRITICAL ERROR:", err.message);
  process.exit(1);
});
