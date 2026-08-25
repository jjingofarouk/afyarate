#!/usr/bin/env node
/**
 * One-off: correct + enrich the Mandela Washington Fellowship listing.
 * Official status (per mandelawashingtonfellowship.org, Aug 2026): the
 * Fellowship will NOT take place in 2026; alumni programming continues.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

loadEnv();

// 1. Re-host image
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const buf = readFileSync("/var/folders/7d/lsp5f20n7vj9_nj5bt8hkjrm0000gn/T/opencode/mwf.jpg");
const filename = "mandela-washington-fellowship.jpg";
const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) { console.error("upload failed:", await up.text()); process.exit(1); }
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
console.log(`Uploaded -> ${publicUrl}`);

// 2. Update post
const title = "Mandela Washington Fellowship for Young African Leaders (Paused - No 2026 Program)";

const description = [
"**Status update (August 2026):** Per the official program website, **the Mandela Washington Fellowship will not take place in 2026.** The Fellowship continues to offer opportunities for Alumni, and future cycles have not been announced. This listing is kept as a reference/watch item - prospective applicants are encouraged to reach out to their local U.S. embassy or consulate to learn about other U.S. Department of State-sponsored exchange programs and U.S. higher education opportunities (find yours at usembassy.gov).",
"",
"**About the Fellowship**",
"",
"The Mandela Washington Fellowship for Young African Leaders is the flagship program of the U.S. Government's Young African Leaders Initiative (YALI). Since 2014, nearly **7,800 young leaders** from every country in Sub-Saharan Africa - including hundreds of Ugandans - have participated. Fellows, between the ages of **25 and 35**, are accomplished leaders with established records of promoting innovation and positive impact in their communities and countries.",
"",
"**Fellowship Components (when the program runs):**",
"",
"- **Leadership Institutes:** Six-week executive-style Institutes hosted by U.S. colleges or universities, where Fellows enrich local U.S. communities while sharing best practices.",
"- **Professional Development Experiences (PDEs):** Optional placements of up to six weeks with private, public, and non-profit organizations in the U.S., during the Fellowship or as Alumni.",
"- **Reciprocal Exchanges:** U.S. citizens apply to implement projects in sub-Saharan African countries, continuing collaborative work with Fellowship Alumni on the continent.",
"- **Opportunities for Alumni:** Ongoing in-person and virtual professional development, networking and collaboration opportunities with support from the U.S. Department of State and affiliated partners.",
"",
"**Historically Fully Funded:**",
"",
"When active, the Fellowship covered J-1 visa support, round-trip travel to the U.S., housing, meals, and a modest allowance - with zero application fees. Selection involved independent review of applications followed by semifinalist interviews at U.S. embassies (including Kampala).",
"",
"**What Ugandan Health Workers Should Do Now:**",
"",
"- Monitor mandelawashingtonfellowship.org for any announcement of a future cohort.",
"- Explore active alternatives while you wait - e.g., YALI Regional Leadership Center East Africa cohorts and other U.S. Embassy Kampala exchange programs.",
"- Contact the program with questions at mwfellowship@irex.org.",
].join("\n");

const summary = "STATUS UPDATE: The Mandela Washington Fellowship will not take place in 2026 per the official program site. Kept as a watch-listing: since 2014, ~7,800 young African leaders aged 25-35 (fully funded six-week U.S. Leadership Institutes) have participated through this flagship YALI program.";

const eligibility = `When active: citizens/residents of Sub-Saharan African countries including Uganda, aged 25-35, with proven leadership records and English proficiency; no degree requirement; not open to U.S. citizens/residents. Currently PAUSED - no 2026 program; future cohorts unannounced.`;

const howToApply = `No applications are currently open - the Fellowship will not take place in 2026. Watch mandelawashingtonfellowship.org for announcements, contact your local U.S. embassy or consulate (usembassy.gov) about alternative State Department exchange programs, or email mwfellowship@irex.org.`;

const keyDates = "PAUSED: no 2026 Fellowship. Future cycles not yet announced - monitor the official site.";

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query(
  `update public.posts set title=$1, description=$2, summary=$3, eligibility=$4, how_to_apply=$5, key_dates=$6, image_url=$7 where slug=$8`,
  [title, description, summary, eligibility, howToApply, keyDates, publicUrl, "mandela-washington-fellowship-for-young-african-leaders-2027"]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
