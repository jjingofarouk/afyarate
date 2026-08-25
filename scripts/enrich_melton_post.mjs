#!/usr/bin/env node
/**
 * One-off: massively enrich the Melton Foundation Global Solvers Accelerator
 * 2027 listing from the official/opportunitiesforyouth source, and attach image.
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
const buf = readFileSync("/var/folders/7d/lsp5f20n7vj9_nj5bt8hkjrm0000gn/T/opencode/melton.jpg");
const filename = "melton-foundation-global-solvers.jpg";
const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) { console.error("upload failed:", await up.text()); process.exit(1); }
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
console.log(`Uploaded -> ${publicUrl}`);

// 2. Update post (blank lines before lists/tables so the renderer formats them)
const description = [
"**Applications are now open for the Global Solvers Accelerator 2027**, the Melton Foundation's leadership, project-development and peer-learning program for emerging changemakers aged 20-35. Around 15-20 practitioners from different countries are selected per cohort to strengthen social-impact projects that are already running on the ground - including public health, community health and health-equity initiatives.",
"",
"**Program Structure:**",
"",
"- Core Accelerator runs **1 April - 30 November 2027** (onboarding in March 2027).",
"- Eight interconnected learning modules combining facilitated thematic sessions, bi-weekly virtual meetings, independent assignments, peer-to-peer learning and project-based exercises.",
"- Approximately **4 hours per week** commitment; participants must maintain at least a **75% participation rate**.",
"- Learning topics include project effectiveness, team dynamics, collective leadership, intersectionality, social innovation, regenerative practices, impact modelling, systems-based approaches, strategic visibility and monitoring & evaluation.",
"- Participants map their projects against the Sustainable Development Goals to connect local action with the global agenda.",
"",
"**Global Solvers Co-Lab 2027 (Fully Funded):**",
"",
"Actively engaged participants are invited to a week-long, fully funded in-person Co-Lab, tentatively **19-26 July 2027** - an intensive working experience to meet peers in person, examine projects, exchange practical knowledge and design new approaches to community impact.",
"",
"**Who Should Apply:**",
"",
"- Aged **20-35 years** (any country, including Uganda).",
"- Actively involved in or leading an existing community or social-impact project - a concrete project or documented project plan is **required** at application; it must address a real community challenge, be grounded in a specific context, and continue for at least the duration of the program.",
"- Sufficient English proficiency and genuine commitment to peer exchange and reflective leadership.",
"- No specific academic degree required. Applications are submitted by individuals; teams should nominate one member to represent the project.",
"",
"Past participants have worked across education equity, climate action, **public health**, civic engagement, livelihoods, disability inclusion, human rights, youth empowerment and technology for social good.",
"",
"**Program Fee & Financial Support:**",
"",
"| Item | Detail |",
"|---|---|",
"| Program fee | USD 900, payable only after selection |",
"| Need-based support | 20%, 50% or up to 80% of the fee |",
"| How to request | Within the original application only (personal statement + endorsement letter) |",
"",
"Requesting financial support does not affect selection decisions, but late requests cannot be considered. Maximum-support applicants remain responsible for 20% of the fee.",
"",
"**Selection Timeline:**",
"",
"- Applications: **15 August - 15 November 2026**",
"- Application and reference review: December 2026 - January 2027",
"- Virtual Assessment Centre: tentatively 30-31 January 2027",
"- Onboarding: March 2027 | Core program: April-November 2027 | Co-Lab: July 2027",
"- Transition into the lifelong **Melton Fellowship** after successful completion",
"",
"Among 2025 participants, 94% became more intentional about collaboration and partnerships, and 91% reported a strong sense of trust and belonging in the community.",
"",
"*Note:* The Melton Foundation also runs the separate **Global Citizenship Learning Program** (fee-free, ages 18-25) - but it is restricted to students at its five partner universities (Ashesi University Ghana, B.M.S. Group of Institutions India, Universidad de La Frontera Chile, Friedrich Schiller University Jena Germany, Dillard University USA). Ugandan applicants not at those universities should apply to the Global Solvers Accelerator instead.",
].join("\n");

const eligibility = `Aged 20-35 (any country incl. Uganda); actively leading or involved in an existing community/social-impact project with a concrete plan that continues through the program; English proficiency; ~4 hrs/week with minimum 75% participation; no degree requirement. Individuals apply; fee USD 900 after selection with need-based support up to 80% requested within the application.`;

const summary = "An eight-month virtual leadership accelerator for ~15-20 social-impact practitioners aged 20-35 worldwide, culminating in a fully funded in-person Co-Lab (July 2027) and entry into the lifelong Melton Fellowship. Applications close November 15, 2026.";

const howToApply = `Apply via the Global Solvers Accelerator application form (Typeform) between August 15 and November 15, 2026. Prepare responses using the official GSA Application Guide; if requesting need-based fee support, include a personal statement on financial circumstances plus an endorsement letter from a credible reference (project supervisor or co-leader) in the original application. Shortlisted candidates attend a virtual Assessment Centre around late January 2027.`;

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query(
  `update public.posts set description = $1, eligibility = $2, summary = $3, how_to_apply = $4, image_url = $5 where slug = $6`,
  [description, eligibility, summary, howToApply, publicUrl, "melton-foundation-global-solvers-accelerator-2027-2026-11-15"]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
