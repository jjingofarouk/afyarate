#!/usr/bin/env node
/**
 * One-off: enrich the Acumen Academy East Africa Fellowship post with the
 * full program details and re-host its hero image in Supabase `post-images`.
 */
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
  process.exit(1);
}

const SLUG = "acumen-academy-east-africa-fellowship-next-intake";
const IMAGE_SRC =
  "https://blog.acumenacademy.org/hubfs/Imported%20sitepage%20images/Urbanfarming_SawaSolutionCentre_Showcasing_Oct2021-1.jpeg";
const IMAGE_NAME = "acumen-east-africa-fellowship.jpg";

// --- 1. Download + re-host the image --------------------------------------
const imgRes = await fetch(IMAGE_SRC, {
  headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
});
if (!imgRes.ok) throw new Error(`image download failed: ${imgRes.status}`);
const buf = Buffer.from(await imgRes.arrayBuffer());
console.log(`Downloaded image (${(buf.length / 1024).toFixed(0)} KB)`);

const up = await fetch(`${supabaseUrl}/storage/v1/object/post-images/${IMAGE_NAME}`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
  body: buf,
});
if (!up.ok) throw new Error(`upload failed: ${up.status}: ${(await up.text()).slice(0, 200)}`);
const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${IMAGE_NAME}`;
console.log(`Uploaded -> ${publicUrl}`);

// --- 2. Update the post ----------------------------------------------------
const description = `**Acumen Academy** is inviting applications for the **East Africa Acumen Fellowship** — a transformative, fully funded leadership program for extraordinary individuals with an entrepreneurial mindset and a commitment to solve problems of poverty. Women and individuals who identify as or serve Forcibly Displaced Persons (FDP) are encouraged to apply.

## About the Fellowship

Acumen invests in social entrepreneurs across the capital continuum. The East Africa Fellowship brings together a cohort of change-makers across Kenya, Uganda, Tanzania, Rwanda, Ethiopia, Burundi, South Sudan and Somalia, and equips them with the tools and community to strengthen their leadership, scale their impact, and create meaningful change in East Africa.

## What you will learn

- **Polarity Management** — operate in a world of opposing views and cross lines of difference to mobilize others towards a shared cause.
- **Good Society Readings** — explore the meaning of a just society through classic and contemporary texts by thinkers such as Plato, Ursula K. LeGuin, Chimamama Adichie, Dr. Martin Luther King, and Amartya Sen.
- **Adaptive Leadership** — understand stakeholders, map their needs, and navigate uncertainty to catalyze change.
- **Authentic Voice** — tell stories that compel and inspire others to act; improve your pitch, talk to investors, and form partnerships.

## Program structure

Fellows remain in their jobs and participate in a **6-month hybrid program** consisting of:

- One 3-day virtual Orientation
- Two 5-day full-time in-person immersives (8 hours of assignments each)
- Three Learning Labs (4 hours each along with assignments)

## After the Fellowship: the Foundry

Upon successful completion, participants join the **Foundry**, Acumen's global community of 1,600+ alumni whose ventures have impacted **50 million lives in 71 countries**. Foundry members get access to:

- Tools and mentorship
- Community
- Amplification
- Early-stage funding

Notable alumni include Abu Musuuza (2012 East Africa Fellow, Uganda), co-founder and CEO of Village Energy, who co-founded three social enterprises — Enlight Institute, Village Energy, and Flip Africa — with people he met through the Acumen community. Kheyti, co-founded by 2014 Fellows, won the prestigious Earthshot Prize, and Kidogo founder Sabrina Habib was among 12 leaders recently awarded $20 million by Melinda French Gates.

*Note: dates shown below are from the most recent application cycle. New intakes are announced periodically — join the notification list on the fellowship page to be alerted when applications reopen.*`;

const summary =
  "A transformative, fully funded 6-month hybrid fellowship for East African social entrepreneurs. Learn adaptive leadership, authentic storytelling and values-based decision-making, then join the Foundry — Acumen's global community of 1,600+ alumni offering mentorship, amplification and early-stage funding.";

const eligibility = `You may be a good fit if you:

- Want to take yourself and your work to the next level and develop as a credible, inspiring moral leader;
- Believe the opposite of poverty is dignity — your organization uses the tools of business to build scalable, market-based solutions to problems of poverty;
- Have a burning ambition to scale your proven solution and are searching for tools and community;
- Are ready to join a global community of peers passionate about solving problems of poverty.

Women and individuals who identify as or serve Forcibly Displaced Persons (FDP) are encouraged to apply.`;

const benefits = `- Fully funded program (all costs covered by Acumen)
- 6-month hybrid program that fits around your job
- Leadership frameworks: Polarity Management, Adaptive Leadership, Authentic Voice, Good Society Readings
- Two in-person immersives plus virtual Learning Labs
- Lifetime membership of the Foundry (1,600+ alumni worldwide)
- Access to tools, mentorship, amplification and early-stage funding`;

const keyDates = `**Typical application cycle** (most recent):

1. Read the Applicant Toolkit — prepare your application
2. Submit the online application (opened January 7th)
3. Selection Conference for shortlisted candidates (April 10th & 11th)
4. Fellowship journey begins (May 14th)

Info sessions are held before the deadline. Join the email list to be notified of the next fellowship.`;

const howToApply = `Apply online at https://fellowship.acumenacademy.org/east-africa. Read the Applicant Toolkit first, prepare essays on your poverty-solving work, and submit before the stated deadline. Shortlisted applicants participate in a Selection Conference. Applications close February 7th in the most recent cycle; join the notification list on the fellowship page to hear when the next call opens.`;

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
const res = await client.query(
  `update public.posts set
     description = $2,
     summary = $3,
     eligibility = $4,
     benefits = $5,
     key_dates = $6,
     how_to_apply = $7,
     image_url = $8,
     updated_at = now(),
     search_text = lower(concat_ws(' ', title, organization, category, profession, location, summary, description, tags::text))
   where slug = $1 returning id`,
  [SLUG, description, summary, eligibility, benefits, keyDates, howToApply, publicUrl]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
