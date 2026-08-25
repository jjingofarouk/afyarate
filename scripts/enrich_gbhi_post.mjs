#!/usr/bin/env node
/**
 * One-off: enrich the GBHI Atlantic Fellows Brain Health listing with fuller
 * program details sourced from gbhi.org.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
import { loadEnv } from "./lib_env.mjs";

loadEnv();

const description = `**Atlantic Fellows for Equity in Brain Health 2027-2028 - Global Brain Health Institute (GBHI)**

GBHI is a partnership between Trinity College Dublin and the University of California, San Francisco (UCSF), dedicated to protecting the world's aging populations from threats to brain health. Since 2016 it has trained 300+ Atlantic Fellows from over 65 countries.

**What the Fellowship Offers:**
- A fully funded 12-month residential fellowship at either Trinity College Dublin (Ireland) or UCSF San Francisco (USA).
- Full program funding covering salary support/stipend, relocation and travel costs, and all academic programming.
- World-class training in brain health, dementia prevention and health equity through seminars, taught modules and project-based work.
- Dedicated mentors among 150+ faculty across clinical care, research, policy, education and the creative arts.
- A project budget to develop your own brain-health intervention to implement back home.
- Lifelong membership in the Atlantic Fellows community - a global network of thousands of fellows across seven Atlantic programs working on fairer, healthier, more inclusive societies.

**Who Should Apply:**
- Mid-career professionals in any brain-health-related discipline: neurologists, geriatricians, primary care physicians, nurses, psychologists, social workers, public health specialists, policymakers, advocates, artists and technologists.
- Applicants from any country - candidates from low- and middle-income countries like Uganda are especially encouraged, as reducing global disparities in dementia care is the institute's core mission.
- Those with English proficiency and a clear project proposal addressing brain health inequities in their home region.

**Program Expectations:**
- Relocate to Dublin or San Francisco for the 12-month fellowship year (July 2027 - June 2028).
- Participate in the core curriculum, weekly seminars and collaborative projects.
- Design and advance a brain-health leadership project with mentor support.

**Application Components:** online application with CV, statements of interest, a project proposal outline, and referee contacts. Shortlisted candidates may be interviewed virtually.

Applications close November 2, 2026 for the cohort starting July 2027.`;

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const res = await client.query(
  `update public.posts set description = $1, search_text = $2 where slug = $3`,
  [
    description,
    ("atlantic fellows equity brain health 2027 2028 global brain health institute gbhi trinity college dublin ucsf san francisco dementia fellowship fully funded " + description).toLowerCase(),
    "atlantic-fellows-for-equity-in-brain-health-2027-2028-2026-11-02",
  ]
);
console.log(`Updated ${res.rowCount} post(s)`);
await client.end();
