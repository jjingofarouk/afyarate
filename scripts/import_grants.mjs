#!/usr/bin/env node
/**
 * Adds real, currently-open health grants where Uganda-based researchers/
 * institutions are eligible, found via live web search on 2026-08-05.
 * Same verification discipline as import_opportunities.mjs: excluded
 * anything with a passed deadline or that I couldn't confirm was still live
 * (e.g. a Global Fund/TASO RFP whose own URL was dated 2024; SAFEStart+ and
 * Grand Challenges Explorations, both past their deadlines).
 *
 * Requires SUPABASE_DB_URL in .env.local.
 * Usage: node scripts/import_grants.mjs
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

loadEnv();
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

function slugify(title, org) {
  return `${title}-${org}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const raw = [
  {
    type: "grant",
    title: "Multiplex Platforms to Assess Micronutrient Status, Inflammation and Infectious Disease",
    org: "Grand Challenges (Gates Foundation)",
    loc: "Uganda (LMIC-focused, open globally)",
    profession: "Laboratory",
    deadline: null,
    url: "https://gcgh.grandchallenges.org/challenge/multiplex-platforms-assess-indicators-micronutrient-status-and-infection-and-inflammation",
    summary: "Funds development of low-cost multiplex diagnostic platforms for micronutrient/inflammation/infectious disease status, targeted at low- and middle-income country settings including Uganda. Open to research institutes, nonprofits, companies and academic institutions.",
    src: "Grand Challenges",
  },
  {
    type: "grant",
    title: "AI-Enabled Consumer Engagement to Advance Family Planning",
    org: "Grand Challenges (Gates Foundation)",
    loc: "Uganda (open globally)",
    profession: null,
    deadline: null,
    url: "https://gcgh.grandchallenges.org/challenge/ai-enabled-consumer-engagement-advance-family-planning",
    summary: "Funds AI-driven approaches to improve family planning consumer engagement and access. Open to research institutes, nonprofits, companies and academic institutions worldwide, including Uganda-based applicants.",
    src: "Grand Challenges",
  },
  {
    type: "grant",
    title: "Enhancing Integrated Research and Healthcare in Sub-Saharan Africa Through Digital Innovation and AI",
    org: "EDCTP3 / Global Health EDCTP3 Joint Undertaking",
    loc: "Uganda (as part of a sub-Saharan Africa consortium)",
    profession: "Public Health",
    deadline: "2026-09-02",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/HORIZON-JU-GH-EDCTP3-2026-03-DIGIT-02",
    summary: "EU–Africa health research partnership funding digital health and AI research; Uganda-based institutions are eligible as consortium partners (Uganda participates in EDCTP's East African Consortium for Clinical Research).",
    src: "EDCTP3",
  },
  {
    type: "grant",
    title: "Training and Innovation Networks for Ethics, Regulatory and Pharmacovigilance Capacity",
    org: "EDCTP3 / Global Health EDCTP3 Joint Undertaking",
    loc: "Uganda (as part of a sub-Saharan Africa consortium)",
    profession: "Public Health",
    deadline: "2026-09-02",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/HORIZON-JU-GH-EDCTP3-2026-03-SERP-01",
    summary: "Funds sustained capacity development in clinical trial ethics, regulatory science, pharmacovigilance and digital regulatory platforms across sub-Saharan Africa. Uganda-based institutions eligible as consortium partners.",
    src: "EDCTP3",
  },
  {
    type: "opportunity",
    title: "Call for Papers: A Lifecycle Perspective on the Health and Care Workforce and Labour Market Dynamics",
    org: "Frontiers (Research Topic)",
    loc: "Uganda (open globally)",
    profession: null,
    deadline: "2026-09-30",
    url: "https://www.frontiersin.org/research-topics/78943/a-lifecycle-perspective-on-the-health-and-care-workforce-and-labour-market-dynamics",
    summary: "Open call for research contributions on health and care workforce dynamics; relevant to Uganda-based health workforce researchers. Not a cash grant — a peer-reviewed publication opportunity, listed here as it's frequently paired with small research/travel grants.",
    src: "CARTA / Frontiers",
  },
];

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log("Connected. Inserting grants...");
  const COLS = [
    "slug", "type", "title", "organization", "category", "profession", "location",
    "country", "description", "summary", "how_to_apply", "application_url",
    "deadline", "source_name", "source_url", "tags", "featured", "status",
  ];
  const colList = COLS.join(",");
  let n = 0;
  for (const r of raw) {
    const slug = slugify(r.title, r.org);
    const row = [
      slug, r.type, r.title, r.org, "Health", r.profession, r.loc, "Uganda",
      `${r.summary} See the application link for full details and requirements.`,
      r.summary, "See application link.", r.url, r.deadline, r.src, r.url,
      [r.type, "Uganda", "Health", "Grant"], false, "published",
    ];
    const placeholders = row.map((_, i) => `$${i + 1}`).join(",");
    await client.query(
      `insert into public.posts (${colList}, published_at) values (${placeholders}, now())
       on conflict (slug) do update set updated_at = now()`,
      row,
    );
    n += 1;
  }
  const c = await client.query("select count(*)::int n from public.posts where status='published' and type='grant'");
  console.log(`Done ✅  inserted/updated ${n} grants. Total published grants in DB: ${c.rows[0].n}`);
} finally {
  await client.end();
}
