#!/usr/bin/env node
/**
 * One-off: enrich the Fast Forward Accelerator 2027 listing with official
 * details from ffwd.org and attach the re-hosted image.
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
const buf = readFileSync("/var/folders/7d/lsp5f20n7vj9_nj5bt8hkjrm0000gn/T/opencode/fastforward.jpg");
const filename = "fast-forward-accelerator.jpg";
const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) { console.error("upload failed:", await up.text()); process.exit(1); }
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
console.log(`Uploaded -> ${publicUrl}`);

// 2. Update post (blank lines before every list/table so the renderer formats them)
const description = [
"**Applications to the 2027 Accelerator are open!**",
"",
"Fast Forward has helped 100+ tech nonprofits scale through its Accelerator since 2014 - 12 years running, 112 portfolio organizations, and $1.4B in follow-on funding raised by alumni.",
"",
"**What You Get:**",
"",
"- **Get Funded:** A $25K+ unrestricted grant to fuel your tech nonprofit.",
"- **Get Networked:** A powerful ecosystem of tech mentors, industry experts and social impact leaders.",
"- **Get Community:** Collaboration with founders who have been in your shoes and can help you get where you are going.",
"",
"**The Program:**",
"",
"Over three months you'll refine your fundraising pitch, strengthen your team and scale your impact with expert mentorship from leaders in tech and social impact. The program culminates in **Demo Day**: after weeks of pitch bootcamp, you take the stage to pitch your plan and vision to hundreds of movers in social impact tech - armed with a polished deck, a compelling mini-documentary and a packed house of new fans.",
"",
"**Beyond the Accelerator:**",
"",
"The journey doesn't end after three months. Through Portfolio Services, every tech nonprofit in the portfolio receives ongoing support - tailored programming, peer circles, one-on-one advising - and continued championing to funders so capital is never a barrier to impact. Alumni include Koko (5M+ young people impacted), Dollar For ($60M+ in medical debt relieved) and SIRUM (2.3M+ prescriptions redistributed).",
"",
"**Eligibility Reminders:**",
"",
"- Open to founders worldwide, including Uganda - location is not a barrier.",
"- You must be pursuing a **nonprofit business model** (not a for-profit startup).",
"- You must have at least a **minimum viable product (MVP)** built.",
"",
"**Deadline:** September 7 at 11:59 p.m. PST.",
"",
"Interested applicants can watch the recording of the Application Workshop on ffwd.org, where recent alumni share what the Accelerator entails and how to make your application shine. Know a promising tech nonprofit? Refer them for a chance at $500.",
].join("\n");

const summary = "A three-month accelerator giving tech nonprofits USD 25K+ in unrestricted seed funding, Demo Day exposure to hundreds of social-impact leaders, expert mentorship and lifelong portfolio support. Applications close September 7, 11:59 p.m. PST.";

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query(
  `update public.posts set description = $1, summary = $2, image_url = $3 where slug = $4`,
  [description, summary, publicUrl, "fast-forward-accelerator-2027-for-tech-nonprofits-2026-09-07"]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
