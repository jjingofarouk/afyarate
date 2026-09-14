#!/usr/bin/env node
/**
 * Import all 7 active Mbarara Regional Referral Hospital (Private Wing)
 * vacancies scraped from The Scholar Jobline employer page
 * (https://thescholarjobline.com/employer/mbarara-regional-referral-hospital/)
 * into the `posts` table.
 *
 * Each listing is cleaned up + enriched (rich markdown description, structured
 * fields) and gets a relevant, profession-matched image that is re-hosted in
 * the public Supabase `post-images` bucket (same pattern as
 * scripts/add_unsplash_listing_images.mjs). Idempotent: upserts on `slug`.
 *
 * Source facts (identical across all 7 adverts, posted 2026-09-03):
 *   - Private Wing contract posts, PSC Form 3 (Revised 2008) in triplicate to
 *     the Registry Unit, Administration block, deadline Thu 26 Sep 2026 5pm.
 *   - Apply: https://mbararahospital.go.ug/job-opotunities-at-mbarara-regional-referral-hospital-private-wing/
 *   - Contact: info@mbararahospital.go.ug, https://mbararahospital.go.ug/
 *
 * Usage: node scripts/import_mbarara_rrh.mjs [--dry-run]
 */
import { createRequire } from "node:module";
import { loadEnv } from "./lib_env.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
if (!supabaseUrl || !key || !dbUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY / SUPABASE_DB_URL");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const ORG = "Mbarara Regional Referral Hospital";
const DEADLINE = "2026-09-26";
const APPLY_URL =
  "https://mbararahospital.go.ug/job-opotunities-at-mbarara-regional-referral-hospital-private-wing/";
const EMPLOYER_SITE = "https://mbararahospital.go.ug/";
const EMPLOYER_EMAIL = "info@mbararahospital.go.ug";
const EMPLOYER_LOGO = "https://thescholarjobline.com/wp-content/uploads/2026/09/download-3.jpg";

// Profession-matched, content-verified Unsplash photos (same IDs as
// scripts/add_unsplash_listing_images.mjs).
const U = (id) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;

const HOW_TO_APPLY = `Apply to the Private Wing, ${ORG}:

1. Fill **PSC Form 3 (Revised 2008) in triplicate**.
2. Attach a **cover letter, copy of your National ID, CV, photocopies of certificates and academic transcripts**, plus **contact details of two professional referees**. State your contact address and telephone number clearly.
3. Submit to the **Registry Unit, Administration block, ${ORG}**, no later than **Thursday 26 September 2026, 5:00pm**.
4. Full advert and updates: ${APPLY_URL}

Only shortlisted candidates will be contacted. Never pay money during the application process.`;

const REQUIRED_DOCS =
  "Cover letter; PSC Form 3 (Revised 2008) in triplicate; copy of National ID; CV; photocopies of certificates and academic transcripts; contacts of two professional referees.";

const KEY_DATES = "Posted: 3 September 2026. Deadline: Thursday 26 September 2026, 5:00pm EAT.";

function baseDescription({ intro, posts, salary, terms, reportsTo, quals, otherReqs, duties, sourceUrl }) {
  return `## About the hospital

**${ORG}** is Uganda's public regional referral hospital for the Ankole sub-region, based in Mbarara City. Its **Private Wing** offers specialised, fee-paying clinical services alongside the public hospital, and is recruiting contract staff across clinical and support roles.

## Role overview

${intro}

- **Posts available:** ${posts}
- **Salary:** ${salary}
- **Terms of employment:** ${terms}
- **Reports to:** ${reportsTo}
- **Duty station:** ${ORG}, Private Wing — Mbarara, Uganda

## Qualifications

${quals}
${otherReqs ? `\n${otherReqs}\n` : ""}
## Duties and responsibilities

${duties}

## How to apply

${HOW_TO_APPLY}

## Source

Advertised on The Scholar Jobline (${sourceUrl}) on behalf of ${ORG}. Original application notice: ${APPLY_URL}. Employer website: ${EMPLOYER_SITE} · Email: ${EMPLOYER_EMAIL}.

> **Fraud warning:** no payments should be made at any stage of this recruitment. The Scholar Jobline does not recruit on behalf of the employer.`;
}

const listings = [
  {
    slug: "medical-officer-private-wing-mbarara-rrh-2026-09-26",
    title: "Medical Officer (3 posts) — Private Wing",
    profession: "Doctor",
    qualification: "MBChB or equivalent from a recognised institution; registered and licensed with the Uganda Medical and Dental Practitioners Council; valid Annual Practising Licence.",
    eligibility: "Doctors licensed by the Uganda Medical and Dental Practitioners Council with a valid Annual Practising Licence.",
    experience_level: "Mid-level",
    summary: "3 Medical Officer contract posts in the Private Wing of Mbarara Regional Referral Hospital — diagnosis, treatment, referrals, outreaches and reporting. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **three (3) Medical Officers** to provide general clinical care — diagnosing, treating and referring patients — while supporting planning, budgeting, outreaches, research and CPD.`,
      posts: "**Three (3)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "In-charge, Private Wing",
      quals: `- MBChB or equivalent from a recognised institution\n- Registered and licensed with the Uganda Medical and Dental Practitioners Council\n- Valid Annual Practising Licence`,
      otherReqs: null,
      duties: `a) Participate in planning and budgeting activities\nb) Diagnose, treat and refer patients\nc) Account for allocated resources\nd) Participate in outreach health programmes\ne) Participate in research activities\nf) Participate in continuous professional development\ng) Adhere to the professional code of conduct and ethics\nh) Compile and submit reports`,
      sourceUrl: "https://thescholarjobline.com/job/medical-officer-three-03/",
    }),
    image_source_url: U("1576091160399-112ba8d25d1d"), // doctor on phone — clinical
    source_url: "https://thescholarjobline.com/job/medical-officer-three-03/",
    tags: ["job", "doctor", "medical officer", "hospital", "Mbarara", "contract"],
  },
  {
    slug: "enrolled-nurse-private-wing-mbarara-rrh-2026-09-26",
    title: "Enrolled Nurse (7 posts) — Private Wing",
    profession: "Nurse / Midwife",
    qualification: "Certificate in Enrolled Nursing or Enrolled Comprehensive Nursing from a recognised institution; valid registration and practising licence with the Uganda Nurses and Midwives Council.",
    eligibility: "Enrolled nurses registered with the Uganda Nurses and Midwives Council; patient-focused with a pleasant personality.",
    experience_level: "Mid-level",
    summary: "7 Enrolled Nurse contract posts in the Private Wing of Mbarara Regional Referral Hospital — ward coverage, treatment, observations and health education. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **seven (7) Enrolled Nurses** to provide continuous bedside nursing coverage across wards and units — keeping patients comfortable, giving prescribed treatment, keeping records and joining ward rounds.`,
      posts: "**Seven (7)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "Assistant Nursing Officer (Nursing)",
      quals: `- Certificate in Enrolled Nursing or Certificate in Enrolled Comprehensive Nursing from a recognised institution\n- Valid registration and practising licence with the Uganda Nurses and Midwives Council`,
      otherReqs: `**Other requirements:** patient-focused approach and pleasant personality.`,
      duties: `a) Provide continuous nursing coverage on wards/units — receive reports and hand over effectively to incoming staff\nb) Keep patients comfortable and ensure a clean, safe environment\nc) Give treatment as prescribed and carry out nursing procedures\nd) Carry out observations, keep proper records and ensure their safe custody\ne) Participate in ward rounds conducted by clinicians\nf) Receive patients; register admissions and discharges\ng) Ensure aseptic technique in procedures\nh) Maintain close contact with patients and ensure confidentiality\ni) Carry out health education for patients and attendants\nj) Participate in Primary Health Care activities\nk) Any other duties as assigned`,
      sourceUrl: "https://thescholarjobline.com/job/enrolled-nurse-seven-7/",
    }),
    image_source_url: U("1622253692010-333f2da6031d"), // nurse portrait
    source_url: "https://thescholarjobline.com/job/enrolled-nurse-seven-7/",
    tags: ["job", "nurse", "enrolled nurse", "hospital", "Mbarara", "contract"],
  },
  {
    slug: "enrolled-midwife-private-wing-mbarara-rrh-2026-09-26",
    title: "Enrolled Midwife (1 post) — Private Wing",
    profession: "Nurse / Midwife",
    qualification: "Certificate in Enrolled Midwifery from a recognised institution; valid registration and practising licence with the Uganda Nurses and Midwives Council.",
    eligibility: "Enrolled midwives registered with the Uganda Nurses and Midwives Council; patient-focused with a pleasant personality.",
    experience_level: "Mid-level",
    summary: "1 Enrolled Midwife contract post in the Private Wing of Mbarara Regional Referral Hospital — antenatal, labour, puerperium and ward care. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **one (1) Enrolled Midwife** to provide maternal and newborn care — antenatal clinics with high-risk screening, supervised labour, puerperium care with breastfeeding support, and general ward nursing.`,
      posts: "**One (1)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "In-charge, Private Wing (maternity services)",
      quals: `- Certificate in Enrolled Midwifery from a recognised institution\n- Valid registration and practising licence with the Uganda Nurses and Midwives Council`,
      otherReqs: `**Other requirements:** patient-focused approach and pleasant personality.`,
      duties: `a) Receive patients; register admissions, discharges and deaths\nb) Carry out antenatal care with emphasis on identifying high-risk cases\nc) Provide care during labour — proper records, correct drug use, prevention of complications to mother and baby\nd) Provide care during the puerperium — infection prevention and successful breastfeeding\ne) Participate in bedside nursing procedures as a member of the caring team\nf) Participate in doctors' and clinical officers' ward rounds\ng) Carry out observations, keep records and ensure their safe custody\nh) Prepare patients for meals and participate in serving them\ni) Keep patients comfortable and ensure a healthy environment\nj) Adhere to professional codes of conduct and ethics\nk) Manage and account for allocated resources; compile daily ward reports and hand over to the incoming shift\nl) Any other duties as assigned`,
      sourceUrl: "https://thescholarjobline.com/job/enrolled-midwife-one/",
    }),
    image_source_url: U("1584515979956-d9f6e5d09982"), // nurse administering injection — maternal/ward care
    source_url: "https://thescholarjobline.com/job/enrolled-midwife-one/",
    tags: ["job", "midwife", "maternal health", "hospital", "Mbarara", "contract"],
  },
  {
    slug: "pharmacy-technician-private-wing-mbarara-rrh-2026-09-26",
    title: "Pharmacy Technician (4 posts) — Private Wing",
    profession: "Pharmacist",
    qualification: "Diploma in Pharmacy or equivalent from a recognised institution; valid registration and practising licence with the Uganda Allied Health Professionals Council.",
    eligibility: "Pharmacy technicians/dispensers registered with the Uganda Allied Health Professionals Council, with communication, counselling, interpersonal and team-building skills.",
    experience_level: "Mid-level",
    summary: "4 Pharmacy Technician contract posts in the Private Wing of Mbarara Regional Referral Hospital — dispensing, compounding, counselling and drug-stock reporting. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **four (4) Pharmacy Technicians** to run safe, patient-friendly dispensing — compounding and issuing medicines, preparing sterile infusions, counselling patients on use and storage, and keeping clean drug stocks and reports.`,
      posts: "**Four (4)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "Senior Dispenser",
      quals: `- Diploma in Pharmacy or its equivalent from a recognised institution\n- Valid registration and practising licence with the Uganda Allied Health Professionals Council`,
      otherReqs: `**Other requirements:** communication, counselling, interpersonal and team-building skills.`,
      duties: `a) Compound drugs and issue medicines to patients\nb) Prepare sterile, pathogen-free infusions\nc) Advise patients and attendants on the proper use and storage of medicines\nd) Service equipment regularly and keep it functional\ne) Identify and classify drugs, keep stock, and adhere to the Professional Code of Conduct and Ethics\nf) Participate in training students and other health workers\ng) Compile and submit reports on drug use\nh) Any other duties as assigned`,
      sourceUrl: "https://thescholarjobline.com/job/pharmacy-technician-four-04/",
    }),
    image_source_url: U("1631549916768-4119b2e5f926"), // pharmacy blister packs
    source_url: "https://thescholarjobline.com/job/pharmacy-technician-four-04/",
    tags: ["job", "pharmacy", "dispenser", "hospital", "Mbarara", "contract"],
  },
  {
    slug: "medical-laboratory-technician-private-wing-mbarara-rrh-2026-09-26",
    title: "Medical Laboratory Technician (2 posts) — Private Wing",
    profession: "Laboratory",
    qualification: "Diploma in Laboratory Technology or equivalent from a recognised institution; valid registration and practising licence with the Uganda Allied Health Professionals Council.",
    eligibility: "Laboratory technicians registered with the Uganda Allied Health Professionals Council, with good communication, interpersonal and team-building skills.",
    experience_level: "Mid-level",
    summary: "2 Medical Laboratory Technician contract posts in the Private Wing of Mbarara Regional Referral Hospital — investigations, QA, specimen prep and equipment care. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **two (2) Medical Laboratory Technicians** to deliver reliable diagnostics — running investigations for clinicians, preparing specimens and reagents, maintaining equipment, and upholding lab quality assurance and safety.`,
      posts: "**Two (2)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "Medical Laboratory Technologist",
      quals: `- Diploma in Laboratory Technology or its equivalent from a recognised institution\n- Valid registration and practising licence with the Uganda Allied Health Professionals Council`,
      otherReqs: `**Other requirements:** good communication, interpersonal and team-building skills.`,
      duties: `a) Carry out laboratory investigations and submit reports to clinicians\nb) Service and maintain laboratory equipment to keep it functional\nc) Participate in laboratory quality assurance\nd) Prepare specimens and reagents according to established procedures\ne) Follow safety measures against hazards\nf) Maintain an inventory of laboratory equipment\ng) Adhere to the professional Code of Conduct and Ethics\nh) Manage and account for allocated resources\ni) Compile and submit periodic reports`,
      sourceUrl: "https://thescholarjobline.com/job/enrolled-midwife-one-2/",
    }),
    image_source_url: U("1579154204601-01588f351e67"), // laboratory room
    source_url: "https://thescholarjobline.com/job/enrolled-midwife-one-2/",
    tags: ["job", "laboratory", "diagnostics", "hospital", "Mbarara", "contract"],
  },
  {
    slug: "askari-private-wing-mbarara-rrh-2026-09-26",
    title: "Askari (3 posts) — Private Wing",
    profession: null,
    qualification: "Uganda Certificate of Education (UCE).",
    eligibility: "Ugandans with a Uganda Certificate of Education who meet public-service security-guard requirements.",
    experience_level: "Entry-level",
    summary: "3 Askari (security guard) contract posts in the Private Wing of Mbarara Regional Referral Hospital — premises security, patrols, access control and flag duties. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **three (3) Askaris** to keep the hospital's people, vehicles and property safe — locking and patrolling premises, guarding entry points, directing visitors, and reporting incidents.`,
      posts: "**Three (3)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "In-charge, Private Wing",
      quals: `- Uganda Certificate of Education (UCE)`,
      otherReqs: null,
      duties: `a) Check and properly lock premises at the close of the day\nb) Apprehend and question suspects for proper identification\nc) Direct visitors to reception for more information\nd) Report theft cases and prepare reports to the authorities\ne) Patrol premises to ensure maximum security\nf) Maintain security of government vehicles and property\ng) Keep security at important entry points\nh) Guard against removal of hospital property by unauthorised individuals\ni) Hoist and lower the National and other flags\nj) Any other duties as assigned`,
      sourceUrl: "https://thescholarjobline.com/job/askari-three/",
    }),
    image_source_url: U("1521737604893-d14cc237f11d"), // professional team/office — facility support role
    source_url: "https://thescholarjobline.com/job/askari-three/",
    tags: ["job", "security", "askari", "hospital", "Mbarara", "contract"],
  },
  {
    slug: "porter-private-wing-mbarara-rrh-2026-09-26",
    title: "Porter (2 posts) — Private Wing",
    profession: null,
    qualification: "Uganda Certificate of Education (UCE).",
    eligibility: "Ugandans with a Uganda Certificate of Education who are physically fit for messenger, cleaning and event-support duties.",
    experience_level: "Entry-level",
    summary: "2 Porter contract posts in the Private Wing of Mbarara Regional Referral Hospital — document delivery, cleaning, and meeting/event support. Deadline 26 Sep 2026.",
    description: baseDescription({
      intro: `The Private Wing seeks **two (2) Porters** to keep the wing running day to day — moving supplies and documents, cleaning and maintaining premises, setting up meetings and events, and reporting maintenance issues.`,
      posts: "**Two (2)**",
      salary: "Attractive (contract, Private Wing)",
      terms: "Contract, full-time",
      reportsTo: "In-charge, Private Wing",
      quals: `- Uganda Certificate of Education (UCE)`,
      otherReqs: null,
      duties: `a) Assist in transporting office supplies and documents\nb) Clean and maintain office premises and facilities\nc) Support staff in setting up equipment and materials for meetings or events\nd) Deliver documents and messages within and outside the office premises\ne) Report any maintenance issues in the office facilities`,
      sourceUrl: "https://thescholarjobline.com/job/pharmacy-technician-four-04-2-2-2/",
    }),
    image_source_url: U("1550831107-1553da8c8464"), // clipboard/admin — document delivery + office support
    source_url: "https://thescholarjobline.com/job/pharmacy-technician-four-04-2-2-2/",
    tags: ["job", "porter", "support staff", "hospital", "Mbarara", "contract"],
  },
];

async function fetchWithTimeout(input, opts = {}, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function downloadImage(sourceUrl) {
  const res = await fetchWithTimeout(sourceUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${res.status} for ${sourceUrl}`);
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!mime.startsWith("image/")) throw new Error(`not an image (${mime})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("empty image download");
  return { buf, mime };
}

async function uploadToBucket(filename, buf, mime) {
  const res = await fetchWithTimeout(`${supabaseUrl}/storage/v1/object/post-images/${filename}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime },
    body: buf,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`upload ${res.status}: ${body.slice(0, 200)}`);
  }
  return `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
}

function searchText(r) {
  return [r.title, r.organization, r.category, r.profession, r.location, r.summary, r.description, r.qualification]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const stamp = Date.now().toString(36);
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

let ok = 0;
for (const l of listings) {
  const row = {
    slug: l.slug,
    type: "job",
    title: l.title,
    organization: ORG,
    category: "Health",
    profession: l.profession,
    location: "Mbarara, Uganda",
    country: "Uganda",
    employment_type: "Contract · Full-time",
    experience_level: l.experience_level,
    qualification: l.qualification,
    eligibility: l.eligibility,
    salary: "Attractive (contract, Private Wing)",
    description: l.description,
    summary: l.summary,
    how_to_apply: HOW_TO_APPLY,
    application_url: APPLY_URL,
    application_email: null,
    deadline: DEADLINE,
    source_name: "The Scholar Jobline",
    source_url: l.source_url,
    tags: l.tags,
    benefits: "Contract employment in the Private Wing of a national referral hospital; continuous professional development (clinical roles).",
    required_documents: REQUIRED_DOCS,
    key_dates: KEY_DATES,
    featured: false,
    status: "published",
    published_at: new Date().toISOString(),
    views: 0,
    search_text: "",
    image_url: null,
  };
  row.search_text = searchText(row);

  console.log(`\n# ${row.title}`);
  console.log(`  image: ${l.image_source_url} (employer logo archived: ${EMPLOYER_LOGO})`);
  if (!dryRun) {
    try {
      const { buf, mime } = await downloadImage(l.image_source_url);
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] ?? "jpg";
      const filename = `mbarara-rrh-${l.slug.slice(0, 40)}-${stamp}.${ext}`;
      row.image_url = await uploadToBucket(filename, buf, mime);
      console.log(`  hosted -> ${row.image_url}`);
    } catch (e) {
      console.log(`  image FAILED (${e.message}); falling back to employer logo`);
      try {
        const { buf, mime } = await downloadImage(EMPLOYER_LOGO);
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] ?? "jpg";
        const filename = `mbarara-rrh-logo-${l.slug.slice(0, 30)}-${stamp}.${ext}`;
        row.image_url = await uploadToBucket(filename, buf, mime);
        console.log(`  hosted logo -> ${row.image_url}`);
      } catch (e2) {
        console.log(`  logo fallback also FAILED: ${e2.message}; continuing without image`);
      }
    }

    const cols = Object.keys(row).filter((c) => row[c] !== null && row[c] !== undefined && row[c] !== "");
    const params = cols.map((c) => (Array.isArray(row[c]) ? row[c] : row[c]));
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
    const conflict = cols
      .filter((c) => c !== "slug")
      .map((c) => `${c} = excluded.${c}`)
      .concat("updated_at = now()")
      .join(", ");
    await client.query(
      `insert into public.posts (${cols.join(",")}) values (${placeholders}) on conflict (slug) do update set ${conflict}`,
      params,
    );
    console.log(`  upserted ${row.slug}`);
    ok++;
  } else {
    console.log(`  (dry-run) would upsert ${row.slug}`);
  }
}

await client.end();
console.log(`\nDone ${dryRun ? "(dry-run) " : ""}→ ${dryRun ? listings.length : ok}/${listings.length} Mbarara RRH listings processed.`);
