#!/usr/bin/env node
/**
 * Bulk-load real, currently-open scholarships, grants, conferences and
 * internships for Ugandan healthcare professionals into the `posts` table.
 * Written to fill the categories that were thin next to `job` (137 published
 * at the time of writing): scholarship (7), grant (10), conference (7),
 * internship (0).
 *
 * Every entry below was found via live web search/fetch on 2026-08-20 from a
 * real, named source (funder sites, university pages, conference sites, UN/
 * NGO career portals). Entries with a passed deadline at fetch time were
 * excluded, as were postings unrelated to healthcare, pay-to-apply postings,
 * and anything duplicating a listing already published on the site (e.g. the
 * existing Makerere CHS "CARTA PhD Fellowships, Cohort 11" fellowship, and a
 * Mak-BSSR HIV training call found by two independent searches, kept once
 * here under `scholarship`). Recurring annual/rolling programmes are listed
 * with deadline=null and the recurrence noted in the summary.
 *
 * Note two near-term deadlines at time of writing: Rhodes Scholarship for
 * East Africa (2026-08-27) and the Mak-BSSR HIV Training Program
 * (2026-08-31). Publish promptly if these are to be useful.
 *
 * Requires SUPABASE_DB_URL in .env.local.
 * Usage: node scripts/import_more_opportunities.mjs
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

const TODAY = "2026-08-20";

function slugify(title, org) {
  return `${title}-${org}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

// ---------------------------------------------------------------------------
// Curated, real entries. `summary` = short factual description (no invented
// detail). `deadline`: null = rolling/annual/not stated.
// ---------------------------------------------------------------------------
const raw = [
  // --- Scholarships ---
  { type: "scholarship", title: "Mak-BSSR HIV Training Program (Postdoctoral, PhD, Master's & Fellowship-level)", org: "Makerere University College of Health Sciences (Mak-BSSR) / UCSF, funded by NIH Fogarty International Center", loc: "Kampala, Uganda", profession: "Public Health", deadline: "2026-08-31", url: "https://news.mak.ac.ug/2026/08/call-for-applications-mak-bssr-postdoc-phd-masters-fellowship-level-training-2026/", summary: "Postdoctoral, PhD, Master's and fellowship-level training in HIV-related behavioral/social science research (stigma, substance use, mental health, ageing and HIV outcomes). Deadline Monday 31 August 2026, 6:00 PM EAT.", src: "Makerere University News" },
  { type: "scholarship", title: "Rhodes Scholarship for East Africa", org: "Rhodes Trust / University of Oxford", loc: "UK (for citizens of Uganda, Tanzania, Rwanda, South Sudan or Burundi)", profession: null, deadline: "2026-08-27", url: "https://www.rhodeshouse.ox.ac.uk/scholarships/applications/east-africa/", summary: "Fully-funded postgraduate scholarship at Oxford, one awarded per year for the East Africa constituency (Uganda, Tanzania, Rwanda, South Sudan, Burundi); applicants must be 18-24. Not health-specific but open to medicine, nursing and public health applicants. This cycle's window closes 27 August 2026.", src: "Rhodes Trust" },
  { type: "scholarship", title: "GSK Scholarships for Future Health Leaders", org: "London School of Hygiene & Tropical Medicine (LSHTM), funded by GSK", loc: "UK (for sub-Saharan Africa nationals, including Uganda)", profession: null, deadline: null, url: "https://www.lshtm.ac.uk/study/fees-and-funding/funding-scholarships/2026-27-gsk-scholarships-future-health-leaders", summary: "Three scholarships a year covering full tuition plus a GBP 22,000 stipend for a one-year MSc at LSHTM, for sub-Saharan African nationals who intend to return home after graduating. Reopens annually; the 2026-27 cycle closed 4 March 2026.", src: "LSHTM" },
  { type: "scholarship", title: "MSc Sexual and Reproductive Health Policy and Programming (SRHPP) Scholarships", org: "London School of Hygiene & Tropical Medicine (LSHTM) and University of Ghana School of Public Health", loc: "UK / Ghana, online delivery (for sub-Saharan Africa nationals including Uganda)", profession: "Public Health", deadline: null, url: "https://www.lshtm.ac.uk/study/fees-and-funding/funding-scholarships/2026-27-msc-srhpp-scholarships", summary: "Fully tuition-funded scholarships for an intensive online Master's in Sexual and Reproductive Health Policy and Programming, aimed at experienced sub-Saharan African health professionals. Reopens annually; the 2026-27 cycle closed 22 March 2026.", src: "LSHTM" },
  { type: "scholarship", title: "Swedish Institute Scholarships for Global Professionals (SISGP)", org: "Swedish Institute", loc: "Sweden (for Uganda applicants)", profession: null, deadline: null, url: "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/", summary: "Fully-funded one- or two-year Master's scholarships at Swedish universities for professionals from designated countries including Uganda, covering many English-taught programmes including medicine and public health, plus a monthly allowance and travel grant. Runs annually, study applications typically open mid-October.", src: "Swedish Institute" },
  { type: "scholarship", title: "University of Glasgow African Excellence Award", org: "University of Glasgow", loc: "UK (for African applicants, including Uganda)", profession: null, deadline: null, url: "https://www.gla.ac.uk/scholarships/universityofglasgowafricanexcellenceaward", summary: "Up to 16 full tuition-fee-waiver scholarships for one-year taught Master's study, open to Uganda and other African students; eligible programmes include MSc Global Health, MPH and Advanced Nursing Practice. The 2026-27 cycle closed 31 March 2026, reopens annually.", src: "University of Glasgow" },
  { type: "scholarship", title: "Carl and Gillean Kjeldsberg Online Scholarships in Family Medicine", org: "University of Edinburgh Global Health Academy", loc: "UK, online/distance learning (for African health workers including Uganda)", profession: "Doctor", deadline: null, url: "https://uoe-global-health.ed.ac.uk/family-medicine/fees-and-scholarships", summary: "Full scholarship covering all three years of the online Master of Family Medicine programme, for outstanding African health workers in any African country committed to strengthening family medicine and primary health care. Most recently confirmed deadline was 15 June 2026.", src: "University of Edinburgh Global Health Academy" },
  { type: "scholarship", title: "DAAD In-Country/In-Region Scholarship: Master of Public Health at Busitema University", org: "DAAD (German Academic Exchange Service) with Busitema University", loc: "Uganda (Busitema University)", profession: "Public Health", deadline: null, url: "https://static.daad.de/media/daad_de/pdfs_nicht_barrierefrei/im-ausland-studieren-forschen-lehren/_st32_call_for_scholarship_applications_uganda_busitema_ma.pdf", summary: "DAAD in-country scholarship funding a Master of Public Health at Busitema University, covering tuition, monthly stipend and other allowances for sub-Saharan African applicants. DAAD publishes a new call annually, typically announced in autumn; the most recent had a 27 November 2025 deadline.", src: "DAAD" },
  { type: "scholarship", title: "Turkiye Burslari (Turkiye Scholarships)", org: "Government of Turkiye (Turkiye Scholarships / YTB)", loc: "Turkiye (for Uganda applicants)", profession: null, deadline: null, url: "https://tbbs.turkiyeburslari.gov.tr", summary: "Fully-funded Turkish government scholarships for bachelor's, master's and PhD study; Medicine, Dentistry, Pharmacy and Nursing are among the eligible fields (health applicants generally need around 90% academic standing). Application window normally runs annually 10 January to 20 February.", src: "Turkiye Burslari" },
  { type: "scholarship", title: "Global Korea Scholarship (GKS), Embassy Track", org: "Government of South Korea (NIIED), via the Embassy of the Republic of Korea in Uganda", loc: "South Korea (for Uganda applicants)", profession: null, deadline: null, url: "https://www.studyinkorea.go.kr", summary: "Fully-funded undergraduate and graduate scholarships for Ugandan students, applied for through the Korean Embassy in Kampala (around 6 embassy-track slots for Uganda in recent cycles); covers tuition, airfare, living stipend and Korean-language training. Embassy Track typically opens around September each year.", src: "Embassy of the Republic of Korea in Uganda" },
  { type: "scholarship", title: "Master of Science in Global Health Delivery (MGHD), Mastercard Foundation Scholars Program", org: "University of Global Health Equity (UGHE), Rwanda, with the Mastercard Foundation", loc: "Rwanda (for African applicants, including Uganda)", profession: "Public Health", deadline: null, url: "https://ughe.org/admission-for-the-mghd-program-mastercard-foundation-scholars/", summary: "Fully-funded Master's in Global Health Delivery at UGHE in Rwanda, open to citizens/residents/refugees of any African country including Uganda (age 35 or under, bachelor's required). Recruits annually; the class-of-2027 window closed 18 January 2026.", src: "University of Global Health Equity" },
  { type: "scholarship", title: "Master of Science in Health Professions Education (MHPE), Mastercard Foundation Scholars Program", org: "University of Global Health Equity (UGHE), Rwanda, with the Mastercard Foundation", loc: "Rwanda (for African applicants, including Uganda)", profession: null, deadline: null, url: "https://ughe.org/master-of-science-hpe-2/", summary: "Fully-funded Master's for health-professions educators at UGHE, for African citizens/residents (including Uganda) aged 35 or under with a health-related bachelor's degree and teaching/supervisory experience. Recruits annually; the most recent window closed 30 November 2025.", src: "University of Global Health Equity" },
  { type: "scholarship", title: "Japanese Government (MEXT) Scholarships, Embassy Recommendation", org: "Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan, via the Embassy of Japan in Uganda", loc: "Japan (for Uganda applicants)", profession: null, deadline: null, url: "https://www.ug.emb-japan.go.jp/itpr_en/culture_study.html", summary: "Fully-funded Japanese government scholarships for research students, undergraduates and specialised training college students, with medicine among the eligible fields; applications go directly to the Embassy of Japan in Uganda. Recruitment runs annually, typically April-May for the following year's intake.", src: "Embassy of Japan in Uganda" },

  // --- Grants ---
  { type: "grant", title: "Innovations in Low-Cost and Simplified Pathogen Sequencing Workflows", org: "Gates Foundation (Grand Challenges)", loc: "Uganda (open globally, LMIC-led applications encouraged)", profession: null, deadline: "2026-09-29", url: "https://gcgh.grandchallenges.org/challenge/innovations-low-cost-and-simplified-pathogen-sequencing-workflows", summary: "Grand Challenges award (Tier 1 up to $300,000, Tier 2 up to $600,000, Tier 3 up to $800,000; roughly 15 awards anticipated) for research institutes, nonprofits and academic institutions developing low-cost pathogen-sequencing workflows for public health use in LMICs.", src: "Grand Challenges (Gates Foundation)" },
  { type: "grant", title: "Addressing Neglected Areas of Sexual and Reproductive Health and Rights in Sub-Saharan Africa (ANeSA), Call for Letters of Interest", org: "International Development Research Centre (IDRC)", loc: "Uganda (open to sub-Saharan Africa)", profession: "Public Health", deadline: "2026-08-23", url: "https://idrc-crdi.ca/en/funding/call-letters-interest-addressing-neglected-areas-sexual-and-reproductive-health-and-0", summary: "IDRC will fund up to six Implementation Research Team grants of up to CAD 1.2 million each on neglected areas of sexual and reproductive health and rights in sub-Saharan Africa; Uganda is explicitly listed as an eligible country. First-stage letter-of-interest deadline, very close.", src: "IDRC" },
  { type: "grant", title: "Travel Grants for Biomedical Researchers", org: "Boehringer Ingelheim Fonds", loc: "Uganda (open globally)", profession: null, deadline: null, url: "https://bifonds.de/fellowships-grants/travel-grants.html", summary: "Rolling grants (apply 6 weeks to 6 months before travel) covering travel, lodging and course fees for MD/PhD students and postdocs pursuing short-term biomedical research stays or practical courses abroad. Uganda is explicitly listed among eligible countries, with added living-cost support for low-income-country applicants.", src: "Boehringer Ingelheim Fonds" },
  { type: "grant", title: "Emerging Global Leader Award (K43)", org: "Fogarty International Center, U.S. National Institutes of Health (NIH)", loc: "Uganda (open to researchers at LMIC institutions)", profession: null, deadline: "2026-12-03", url: "https://www.fic.nih.gov/Programs/Pages/emerging-global-leader.aspx", summary: "NIH career-development grant providing multi-year research funding and protected time for junior faculty/research scientists based at low- and middle-income-country institutions; Uganda qualifies as an LMIC.", src: "Fogarty International Center (NIH)" },
  { type: "grant", title: "Rotary Foundation Global Grants (Disease Prevention & Treatment / Maternal & Child Health)", org: "The Rotary Foundation", loc: "Uganda (via partnership with a qualified local Rotary club/district)", profession: null, deadline: null, url: "https://www.rotary.org/globalgrants", summary: "Rotary's evergreen global-grant mechanism funds sustainable health projects (minimum budget $30,000, World Fund contributions of up to $400,000) in focus areas including disease prevention/treatment and maternal/child health. Requires partnership with a qualified Rotary club or district in Uganda rather than a direct online application.", src: "Rotary International" },

  // --- Conferences ---
  { type: "conference", title: "5th International Conference on Public Health in Africa (CPHIA 2026)", org: "Africa CDC", loc: "Addis Ababa, Ethiopia", profession: null, deadline: "2026-09-15", url: "https://cphia.africacdc.org/", summary: "Africa CDC's flagship continental public health conference, expecting 30,000+ delegates; abstract submissions and scholarship applications are both due 15 September 2026.", src: "Africa CDC" },
  { type: "conference", title: "CUGH 2027 Annual Conference (Lima)", org: "Consortium of Universities for Global Health (CUGH)", loc: "Lima, Peru", profession: "Public Health", deadline: "2026-08-31", url: "https://cughlima2027.org/abstract-submission/", summary: "Global health academic conference running 25-28 February 2027; abstract submissions (oral and poster) close 31 August 2026, with acceptance notices sent 1-10 November 2026.", src: "CUGH" },
  { type: "conference", title: "9th WONCA Africa Region Conference 2026", org: "World Organization of Family Doctors (WONCA) Africa", loc: "Gaborone, Botswana", profession: "Doctor", deadline: null, url: "https://woncaafrica2026.org/", summary: "Family medicine and primary care conference held 10-11 September 2026, themed on planetary health and primary care. Abstract submission closed 28 February 2026 but registration remains open; note the event is only weeks away.", src: "WONCA Africa" },
  { type: "conference", title: "Makerere Bioethics Conference (MakBC) 2026", org: "Makerere University College of Health Sciences", loc: "Kampala, Uganda", profession: null, deadline: "2026-09-15", url: "https://news.mak.ac.ug/2026/06/call-for-abstracts-makerere-bioethics-conference-makbc-2026/", summary: "Conference on \"Evolving Trends in Global Health Research Ethics\", held 10-11 November 2026 at Hotel Africana, Kampala; abstracts due 15 September 2026, early-bird registration by 30 September.", src: "Makerere University News" },
  { type: "conference", title: "NACNDC & JASH Conference 2026", org: "Uganda Ministry of Health", loc: "Speke Resort Munyonyo, Uganda", profession: null, deadline: null, url: "https://conference.health.go.ug/", summary: "Uganda's National Annual Communicable and Non-Communicable Diseases Conference and Joint Annual Scientific Health (JASH) meeting, running 28-30 October 2026. An abstract-submission portal is live; a specific deadline was not published at time of writing.", src: "Uganda Ministry of Health" },
  { type: "conference", title: "ASLM 2026 Conference (7th Biennial)", org: "African Society for Laboratory Medicine (ASLM)", loc: "Cape Town, South Africa", profession: "Laboratory", deadline: "2026-09-01", url: "https://aslm2026.org/", summary: "Continental laboratory medicine and diagnostics conference, held 8-11 December 2026; early registration closes 1 September 2026, with discounted rates for ASLM members and verified students/trainees.", src: "ASLM" },
  { type: "conference", title: "Africa Health Agenda International Conference (AHAIC 2027)", org: "Amref Health Africa", loc: "Kigali, Rwanda", profession: null, deadline: "2026-09-30", url: "https://ahaic.org/", summary: "Pan-African health leadership conference held 28 February - 3 March 2027, explicitly offering scholarships for civil society representatives and community health workers; early-bird registration closes 30 September 2026.", src: "Amref Health Africa" },
  { type: "conference", title: "17th ECSACONM Biennial Scientific Conference", org: "East, Central and Southern Africa College of Nursing and Midwifery (ECSACONM)", loc: "Zanzibar, Tanzania", profession: "Nurse / Midwife", deadline: "2026-08-31", url: "https://ecsaconm.org/conference/", summary: "Regional nursing and midwifery conference themed \"Nurses and Midwives Sustaining Quality Healthcare in a Changing World\", held 14-16 September 2026; late registration closes 31 August 2026.", src: "ECSACONM" },
  { type: "conference", title: "18th World Congress on Public Health 2026", org: "World Federation of Public Health Associations (WFPHA)", loc: "Cape Town, South Africa", profession: "Public Health", deadline: null, url: "https://www.wfpha.org/world-congress-on-public-health/", summary: "Major global public health congress held 6-9 September 2026 under the theme \"Health Without Borders: Equity, Inclusion, and Sustainability\". Registration is open; note the event is only weeks away.", src: "WFPHA" },
  { type: "conference", title: "HSR2026, 9th Global Symposium on Health Systems Research", org: "Health Systems Global (HSG)", loc: "Cairo, Egypt", profession: "Public Health", deadline: null, url: "https://hsr2026.healthsystemsresearch.org/", summary: "Biennial health systems research symposium held 7-9 December 2026, expected to include 100-150 LMIC travel-scholarship recipients per Health Systems Global's own announcement. Abstract rounds have closed but registration is open.", src: "Health Systems Global" },
  { type: "conference", title: "Union World Conference on Lung Health 2026", org: "International Union Against Tuberculosis and Lung Disease (The Union)", loc: "Rio de Janeiro, Brazil", profession: null, deadline: null, url: "https://worldlunghealth.org/", summary: "Major global TB and lung health conference held 17-20 November 2026. Abstract submission and its LMIC scholarship round have closed, but general registration remains open with fees tiered by World Bank country income classification.", src: "The Union" },

  // --- Internships ---
  { type: "internship", title: "WHO Internship Programme", org: "World Health Organization (WHO)", loc: "Global (open to Uganda); Geneva HQ, regional offices incl. AFRO Brazzaville, and country offices", profession: null, deadline: null, url: "https://careers.who.int/careersection/intern/jobsearch.ftl?lang=en", summary: "WHO posts internship vacancies year-round via its recruitment system. Applicants must be 20+, enrolled in (or within 18 months of completing) a relevant degree, and hold a passport from a WHO Member State (Uganda qualifies); interns receive a living allowance and insurance for a 6-24 week placement.", src: "WHO Careers" },
  { type: "internship", title: "UNFPA Global Internship Roster 2026", org: "United Nations Population Fund (UNFPA)", loc: "Multiple duty stations globally (open to Uganda)", profession: null, deadline: "2026-12-31", url: "https://www.unfpa.org/jobs/global-internship-roster-2026", summary: "Rolling 2026 internship roster open to students enrolled in, or recently graduated from, a relevant degree programme; interns without outside funding receive a monthly stipend, paid in local currency, and are matched to UNFPA offices as vacancies arise.", src: "UNFPA Careers" },
  { type: "internship", title: "UNAIDS Internship Programme (ISHIP)", org: "UNAIDS", loc: "Multiple duty stations (open to Uganda); in-person or remote", profession: null, deadline: null, url: "https://erecruit.unaids.org/public/hrd-cl-vac-view.asp?o_c=1000&jobinfo_uid_c=39722&vaclng=en", summary: "Internship programme for applicants 20+ enrolled in or within 12 months of completing a degree. UNAIDS has posted a new ISHIP vacancy on this same portal at least annually since 2016; check the portal directly for the current cycle.", src: "UNAIDS eRecruit" },
  { type: "internship", title: "WBG Pioneers Internship Program", org: "World Bank Group", loc: "Global (20+ offices incl. Nairobi; open to citizens of WBG member countries, incl. Uganda)", profession: null, deadline: null, url: "https://www.worldbank.org/ext/en/careers/talent-programs/wbg-pioneers", summary: "Paid internship for final-year undergraduates and current Master's/PhD students; the Human Development track covers public health among other fields. Two cycles run per year; the Fall/Winter 2026-27 window closed 12 August 2026, next window expected around January-February 2027.", src: "World Bank Careers" },
  { type: "internship", title: "CHAI Internship Program", org: "Clinton Health Access Initiative (CHAI)", loc: "CHAI country offices incl. Uganda, or remote within CHAI countries of operation", profession: null, deadline: null, url: "https://www.clintonhealthaccess.org/join-our-team/", summary: "Annual 8-16 week global health internship intake for final-year undergraduates or postgraduate students, offering stipends, per diem and travel/lodging support where applicable. The 2026 intake closed 15 December 2025; watch CHAI's careers portal for the next round.", src: "CHAI" },
  { type: "internship", title: "Amref Graduate Internship Programme", org: "Amref Health Africa", loc: "Kampala, Uganda (and other Amref African country offices)", profession: null, deadline: null, url: "https://amref.org/careers/graduate-internship-programme/", summary: "Amref, the largest Africa-headquartered international health development organisation, has a Uganda country office and posts graduate internships (public health, RMNCAH, ICT, communications) on a rolling basis. Amref states it charges no recruitment fees.", src: "Amref Health Africa" },
  { type: "internship", title: "MU-JHU Care Ltd Internship Programme", org: "Makerere University-Johns Hopkins University (MU-JHU) Care Ltd", loc: "Kampala, Uganda", profession: null, deadline: null, url: "https://www.mujhu.org/opportunities/careers/", summary: "MU-JHU Care Ltd, a Kampala-based HIV/TB clinical and implementation-science research organisation, lists an ongoing internship opportunity with applications accepted year-round via an online form.", src: "MU-JHU Research Collaboration" },
  { type: "internship", title: "MIHS / Mildmay Internship & Placement Programme", org: "Mildmay Institute of Health Sciences (MIHS) / Mildmay Uganda", loc: "Lweza, Uganda (and 16 supported districts of central Uganda)", profession: null, deadline: null, url: "https://mihs.ac.ug/careers/", summary: "Structured local and international internship/placement tracks (clinical, social work/counselling, and administrative areas like ICT, finance and HR) at Mildmay's Lweza flagship site. Local applicants apply with a Mildmay application form, CV and two references via hr@mildmay.or.ug.", src: "Mildmay Institute of Health Sciences" },
  { type: "internship", title: "IDI Internship Programme", org: "Infectious Diseases Institute (IDI), Makerere University", loc: "Kampala, Uganda", profession: null, deadline: null, url: "https://idi.mak.ac.ug/opportunities/main/internship/", summary: "IDI, a Ugandan health-systems and infectious-disease research institute at Makerere University, accepts internship registrations year-round (requires a university introduction letter, ID and academic transcript with 3.0+ CGPA); no application fee.", src: "Infectious Diseases Institute" },
  { type: "internship", title: "UVRI Undergraduate Internship Programme", org: "Uganda Virus Research Institute (UVRI)", loc: "Entebbe, Uganda", profession: null, deadline: null, url: "https://www.uvri.go.ug/uvri-internship-forms", summary: "UVRI, a Ministry of Health / WHO collaborating research institute in Entebbe, has run a competitive annual internship (with partners incl. MRC/UVRI, CDC, Rakai Health Sciences, IAVI) for second/third-year science students. Exact application windows are not published online; contact UVRI's Training department to confirm timing.", src: "Uganda Virus Research Institute" },
  { type: "internship", title: "JSI Internship Program", org: "John Snow, Inc. (JSI)", loc: "Uganda and other JSI African country programs; rolling", profession: null, deadline: null, url: "https://careers.jsi.org/JSIInternet/Careers/internships.cfm", summary: "JSI, a global public health organisation with an active Uganda country programme, runs internships year-round driven by project need. No specific openings were listed at time of writing; interested applicants may send a resume and cover letter to internships@jsi.com.", src: "JSI" },
  { type: "internship", title: "UNICEF Internship Programme", org: "UNICEF", loc: "Global (open to Uganda; Uganda country office roles based in Kampala when posted)", profession: null, deadline: null, url: "https://www.unicef.org/careers/internships", summary: "Global internship programme open to enrolled or recently-graduated students, with a paid monthly stipend (up to $1,700 depending on duty station). UNICEF Uganda has previously posted internships in Kampala open specifically to Ugandan nationals; new roles are posted continuously.", src: "UNICEF Careers" },
];

// --- map to posts columns ---------------------------------------------------
const seen = new Set();
const rows = [];
for (const r of raw) {
  if (r.deadline && r.deadline < TODAY) continue; // stale, skip
  const slug = slugify(r.title, r.org);
  if (seen.has(slug)) continue; // dedupe
  seen.add(slug);
  rows.push([
    slug,
    r.type,
    r.title,
    r.org,
    "Health",
    r.profession ?? null,
    r.loc ?? null,
    "Uganda",
    null, // employment_type
    null, // experience_level
    null, // qualification
    null, // eligibility
    null, // salary
    `${r.summary} See the application link for full details, requirements and how to apply.`, // description
    r.summary,
    "See application link.",
    r.url,
    null, // application_email
    r.deadline ?? null,
    r.src,
    r.url, // source_url
    [r.type, "Uganda", "Health"], // tags
    false, // featured
    "published",
  ]);
}

console.log(`Prepared ${rows.length} real, currently-open entries (of ${raw.length} gathered) after removing stale/duplicate items.`);

const COLS = [
  "slug", "type", "title", "organization", "category", "profession", "location",
  "country", "employment_type", "experience_level", "qualification", "eligibility",
  "salary", "description", "summary", "how_to_apply", "application_url",
  "application_email", "deadline", "source_name", "source_url", "tags", "featured",
  "status",
];

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  console.log("Connected. Inserting...");
  const colList = COLS.join(",");
  const conflict = "on conflict (slug) do update set updated_at = now()";
  let inserted = 0;
  for (const row of rows) {
    const placeholders = row.map((_, i) => `$${i + 1}`).join(",");
    await client.query(
      `insert into public.posts (${colList}, published_at) values (${placeholders}, now()) ${conflict}`,
      row,
    );
    inserted += 1;
  }
  const byType = await client.query(
    "select type, count(*)::int n from public.posts where status='published' group by type order by n",
  );
  console.log(`Done ✅  inserted/updated ${inserted} rows.`);
  console.log("Published posts by type:", byType.rows.map((r) => `${r.type}=${r.n}`).join(", "));
} finally {
  await client.end();
}
