#!/usr/bin/env node
/**
 * One-off: enrich the AU EAN Fellowship listing with official programme details
 * from au.int and attach the re-hosted AU image.
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
const buf = readFileSync("/var/folders/7d/lsp5f20n7vj9_nj5bt8hkjrm0000gn/T/opencode/ean.jpg");
const filename = "african-union-ean-fellowship.jpg";
const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) { console.error("upload failed:", await up.text()); process.exit(1); }
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
console.log(`Uploaded -> ${publicUrl}`);

// 2. Update post
const description = `**Call for Applications - Enterprise Africa Network (EAN) Fellowship Programme Cohort 2 (2026/27)**

An AUC Startup Acceleration Initiative implemented by the AU Commission's Department of Economic Development, Trade, Tourism, Industry and Minerals (ETTIM).

The EAN Fellowship is the African Union's flagship programme for developing micro, small and medium enterprises (MSMEs). The inaugural cohort (2024/25) trained 56 fellows from 30 African countries and produced over USD 1 million in deals and contracts. Cohort 2 expands to **100 fellows drawn from all 55 AU Member States**, targeting USD 2 million in new attributable revenue and 500 new jobs.

**Who Should Apply:**
Youth- and women-led small enterprises that are:
- Registered and operating in an AU Member State (Uganda included);
- Formally registered as a business entity;
- Operating for at least two years; and
- Employing a minimum of three full-time staff.

Applications particularly encouraged from women-led enterprises and businesses from underrepresented AU regions and small island Member States.

**Fellowship Sectors** (aligned with AfCFTA):
- *Products Cluster:* Manufacturing, Agro-processing, Creative Industries
- *Services Cluster:* ICT/Digital, Fintech, **Health**, Logistics/Transport

Health-sector enterprises - clinics, medtech, digital health and health-services SMEs - are explicitly covered.

**Three Fellowship Tiers:**

| Tier | Places | Eligibility |
|---|---|---|
| 1 - Growth | 35 | Operating 2-5 years; minimum 3 employees; demonstrable market traction |
| 2 - Expansion | 40 | Operating 5-10 years; 10-30 employees; cross-border ambition |
| 3 - Scale-Ready | 25 | Operating 10+ years, or investor-ready profile |

A minimum of 40 places (40% of the cohort) are reserved to ensure representation across all five AU continental regions.

**What Fellows Receive:**

- Twelve months of structured training across ten modules differentiated by sector and tier.
- Expert mentorship through African Union partners.
- Access to the African Trade Observatory (ATO) and AfCFTA market intelligence tools.
- Participation in continental events; virtual market-entry sessions across ten AfCFTA pilot countries (Tiers 1 & 2); B2B matchmaking (Tier 3).

**Key Dates:**

- Application Opens: 31 July 2026
- Application Deadline: **30 September 2026**
- Results Communicated: October 2026
- Programme Commences: November 2026

**How to Apply:**

Submit online via the application form, which collects business registration details, sector, years of operation, employee count, trading countries, revenue range, IP status and access to formal finance, plus a written pitch of up to 800 words describing your enterprise, its main market challenge and your objective for the fellowship. Shortlisted applicants will later provide one document verifying finance access (bank or mobile money statement).

*Not eligible:* current/former AUC staff; employees of EAN institutional partners; REC staff; graduates of previous EAN cohorts. Misrepresentation results in permanent ineligibility.

**Contact:** AUEAN@AfricanUnion.org`;

const eligibility = `Youth- and women-led small enterprises registered and operating in an AU Member State (incl. Uganda) for at least two years, formally registered as a business entity, employing at least three full-time staff. Tiers by maturity: Growth (2-5 yrs, 3+ staff), Expansion (5-10 yrs, 10-30 staff), Scale-Ready (10+ yrs or investor-ready). Health-sector enterprises eligible under the Services Cluster.`;

const howToApply = `Apply online via the EAN Fellowship application form on au.int before September 30, 2026: business registration details, sector, years operating, employee count, revenue range, IP status, finance access, plus a written pitch of up to 800 words. Shortlisted applicants provide one finance-access document later. Contact: AUEAN@AfricanUnion.org`;

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query(
  `update public.posts set description = $1, eligibility = $2, how_to_apply = $3, image_url = $4, search_text = $5 where slug = $6`,
  [
    description,
    eligibility,
    howToApply,
    publicUrl,
    ("au enterprise africa network ean fellowship cohort 2 2026 27 african union startup acceleration msme health fintech afcfta " + description).toLowerCase(),
    "au-enterprise-africa-network-ean-fellowship-programme-2026-2027-cohort-2-2026-09-30",
  ]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
