#!/usr/bin/env node
/**
 * Bulk-load real, currently-open jobs/opportunities for Ugandan healthcare
 * professionals into the `posts` table.
 *
 * Every entry below was found via live web search/fetch on 2026-08-05 from a
 * real, named source (job boards, university/NGO career pages, funder sites).
 * Entries with a "Closed"/past-deadline status at fetch time were excluded,
 * as were postings unrelated to healthcare. Recurring annual programmes
 * (Chevening, Commonwealth, Fulbright) are listed with deadline=null since
 * the specific date found was for a cycle that had already closed, the
 * programmes themselves are live and re-open annually.
 *
 * Requires SUPABASE_DB_URL in .env.local.
 * Usage: node scripts/import_opportunities.mjs
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

const TODAY = "2026-08-05";

function slugify(title, org) {
  return `${title}-${org}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

// ---------------------------------------------------------------------------
// Curated, real entries. `d` = short description (factual, no invented
// detail). `deadline`: null = rolling/annual/not stated.
// ---------------------------------------------------------------------------
const raw = [
  // --- Jobs: health facilities / employers (theugandanjobline + greatugandajobs, deduped) ---
  { type: "job", title: "IPC Coordinator", org: "Baylor College of Medicine Children's Foundation Uganda", loc: "Kampala", profession: null, deadline: "2026-08-07", url: "https://theugandanjobline.com/2026/08/ipc-coordinator-jobs-baylor-uganda.html", src: "The Ugandan Jobline" },
  { type: "job", title: "Medical Clinical Officer", org: "Uganda National Institute for Teacher Education (UNITE)", loc: "Kampala", profession: "Clinical Officer", deadline: "2026-08-18", url: "https://theugandanjobline.com/2026/08/medical-clinical-officer-jobs-uganda-national-institute-for-teacher-education.html", src: "The Ugandan Jobline" },
  { type: "job", title: "Assistant Nursing Officer", org: "Uganda National Institute for Teacher Education (UNITE)", loc: "Kampala", profession: "Nurse / Midwife", deadline: "2026-08-18", url: "https://theugandanjobline.com/2026/08/assistant-nursing-officer-jobs-uganda-national-institute-for-teacher-education.html", src: "The Ugandan Jobline" },
  { type: "job", title: "Nurse", org: "Mota-Engil Africa", loc: "Kumi", profession: "Nurse / Midwife", deadline: "2026-09-02", url: "https://theugandanjobline.com/2026/08/nurse-jobs-mota-engil-africa-3.html", src: "The Ugandan Jobline" },
  { type: "opportunity", title: "Call for Proposals: Digital Manufacturing for Prosthetics and Orthotics Services in Uganda", org: "Humanity and Inclusion", loc: "Uganda", profession: "Physiotherapy / Occupational", deadline: "2026-09-04", url: "https://theugandanjobline.com/2026/08/call-for-proposals-study-on-digital-manufacturing-for-prosthetics-and-orthotics-services-in-uganda-humanity-and-inclusion.html", src: "The Ugandan Jobline" },
  { type: "job", title: "Nutrition Assistant", org: "Andre Foods International (AFI)", loc: "Uganda", profession: "Nutrition / Dietetics", deadline: "2026-08-08", url: "https://theugandanjobline.com/2026/08/nutrition-assistant-jobs-andre-foods-international.html", src: "The Ugandan Jobline" },
  { type: "job", title: "Food Safety and Quality Assurance Officer – School Feeding", org: "Andre Foods International (AFI)", loc: "Uganda", profession: "Nutrition / Dietetics", deadline: "2026-08-08", url: "https://theugandanjobline.com/2026/08/food-safety-and-quality-fsq-assurance-officer-school-feeding-jobs-andre-foods-international.html", src: "The Ugandan Jobline" },
  { type: "job", title: "Clinic Manager – Entry Level", org: "Lafab Solutions", loc: "Kampala", profession: null, deadline: "2026-08-14", url: "https://www.greatugandajobs.com/employers/job-detail/job-Clinic-Manager-–-Entry-Level-job-at-Lafab-Solutions-103944", src: "Great Uganda Jobs" },
  { type: "job", title: "Phlebotomist", org: "Kampala Hospital", loc: "Kampala", profession: "Laboratory", deadline: "2026-08-07", url: "https://www.greatugandajobs.com/employers/job-detail/job-Phlebotomist-job-at-Kampala-Hospital-105365", src: "Great Uganda Jobs" },
  { type: "job", title: "Physiotherapist", org: "Kampala Hospital", loc: "Kampala", profession: "Physiotherapy / Occupational", deadline: "2026-08-07", url: "https://www.greatugandajobs.com/employers/job-detail/job-Physiotherapist-job-at-Kampala-Hospital-105366", src: "Great Uganda Jobs" },
  { type: "job", title: "Physiotherapist", org: "UMC Victoria Hospital Limited", loc: "Bukoto, Kampala", profession: "Physiotherapy / Occupational", deadline: "2026-08-10", url: "https://www.greatugandajobs.com/employers/job-detail/job-Physiotherapist-job-at-UMC-Victoria-Hospital-105344", src: "Great Uganda Jobs" },
  { type: "job", title: "Counselor (Female)", org: "Busitema University", loc: "Uganda", profession: "Mental Health", deadline: "2026-08-21", url: "https://www.greatugandajobs.com/employers/job-detail/job-Counselor-Female-job-at-Busitema-University-105242", src: "Great Uganda Jobs" },
  { type: "job", title: "Medical Officer", org: "Busitema University", loc: "Uganda", profession: "Doctor", deadline: "2026-08-21", url: "https://www.greatugandajobs.com/employers/job-detail/job-Medical-Officer-job-at-Busitema-University-105235", src: "Great Uganda Jobs" },
  { type: "job", title: "School Nurse", org: "Lubega Institute of Nursing and Health Professionals", loc: "Iganga", profession: "Nurse / Midwife", deadline: "2026-08-05", url: "https://www.greatugandajobs.com/employers/job-detail/job-School-Nurse-job-at-Lubega-Institute-of-Nursing-and-Health-Professionals-105184", src: "Great Uganda Jobs" },
  { type: "job", title: "Medical Officer", org: "Lubega Institute of Nursing and Health Professionals", loc: "Iganga", profession: "Doctor", deadline: "2026-08-05", url: "https://www.greatugandajobs.com/employers/job-detail/job-Medical-Officer-job-at-Lubega-Institute-of-Nursing-and-Health-Professionals-105185", src: "Great Uganda Jobs" },
  { type: "job", title: "Enrolled Midwife", org: "Ibanda District Local Government", loc: "Ibanda", profession: "Nurse / Midwife", deadline: "2026-09-02", url: "https://www.greatugandajobs.com/employers/job-detail/job-Enrolled-Midwife-job-at-Ibanda-District-Local-Government-105175", src: "Great Uganda Jobs" },
  { type: "job", title: "Enrolled Nurse", org: "Ibanda District Local Government", loc: "Ibanda", profession: "Nurse / Midwife", deadline: "2026-09-02", url: "https://www.greatugandajobs.com/employers/job-detail/job-Enrolled-Nurse-job-at-Ibanda-District-Local-Government-105186", src: "Great Uganda Jobs" },
  { type: "job", title: "Assistant Nursing Officer – Psychiatry", org: "Ibanda District Local Government", loc: "Ibanda", profession: "Mental Health", deadline: "2026-09-02", url: "https://www.greatugandajobs.com/employers/job-detail/job-Assistant-Nursing-Officer-Psychiatry-job-at-Ibanda-District-Local-Government-105165", src: "Great Uganda Jobs" },
  { type: "job", title: "Laboratory Assistant", org: "Ibanda District Local Government", loc: "Ibanda", profession: "Laboratory", deadline: "2026-09-02", url: "https://www.greatugandajobs.com/employers/job-detail/job-Laboratory-Assistant-job-at-Ibanda-District-Local-Government-105167", src: "Great Uganda Jobs" },
  { type: "job", title: "Clinical Officer", org: "Ibanda District Local Government", loc: "Ibanda", profession: "Clinical Officer", deadline: "2026-09-02", url: "https://www.greatugandajobs.com/employers/job-detail/job-Clinical-Officer-job-at-Ibanda-District-Local-Government-105168", src: "Great Uganda Jobs" },
  { type: "job", title: "Clinical Officer", org: "Bishop Stuart University", loc: "Mbarara", profession: "Clinical Officer", deadline: "2026-08-10", url: "https://www.greatugandajobs.com/employers/job-detail/job-Clinical-Officer-job-at-Bishop-Stuart-University-105142", src: "Great Uganda Jobs" },
  { type: "job", title: "Pediatrician", org: "Shalom Medical Center", loc: "Kawempe-Kazo, Kampala", profession: "Doctor", deadline: "2026-08-13", url: "https://www.greatugandajobs.com/employers/job-detail/job-Pediatrician-job-at-Shalom-Medical-Center-105006", src: "Great Uganda Jobs" },
  { type: "job", title: "Gynaecologist", org: "Shalom Medical Center", loc: "Kawempe-Kazo, Kampala", profession: "Doctor", deadline: "2026-08-13", url: "https://www.greatugandajobs.com/employers/job-detail/job-Gynaecologist-job-at-Shalom-Medical-Center-105007", src: "Great Uganda Jobs" },
  { type: "job", title: "Physician", org: "Shalom Medical Center", loc: "Kawempe-Kazo, Kampala", profession: "Doctor", deadline: "2026-08-13", url: "https://www.greatugandajobs.com/employers/job-detail/job-Physician-job-at-Shalom-Medical-Center-105008", src: "Great Uganda Jobs" },

  // --- Jobs: Fuzu (only the one listing that showed as open) ---
  { type: "job", title: "Enrolled Nurse", org: "Kabale University", loc: "Kabale", profession: "Nurse / Midwife", deadline: null, url: "https://www.fuzu.com/uganda/jobs/enrolled-nurse-kabale-university", src: "Fuzu" },

  // --- Jobs: Mildmay Uganda ---
  { type: "job", title: "Dean, School of Nursing and Midwifery", org: "Mildmay Uganda", loc: "Uganda", profession: "Nurse / Midwife", deadline: null, url: "https://mildmay.or.ug/jobs/dean-school-of-nursing-and-midwifery/", src: "Mildmay Uganda" },
  { type: "job", title: "Dean, School of Allied Health Sciences", org: "Mildmay Uganda", loc: "Uganda", profession: "Other Allied Health", deadline: null, url: "https://mildmay.or.ug/jobs/dean-school-of-allied-health-sciences/", src: "Mildmay Uganda" },

  // --- Jobs: health-relevant NGOs (filtered from JobWeb Uganda NGO listing) ---
  { type: "job", title: "Community Mobilizers", org: "Anfaako Nursing Clinic", loc: "Uganda", profession: null, deadline: null, url: "https://jobwebuganda.com/jobs/community-mobilizers-anfaako-nursing-clinic/", src: "JobWeb Uganda" },
  { type: "job", title: "Program Manager", org: "LifeNet International", loc: "Uganda", profession: null, deadline: null, url: "https://jobwebuganda.com/jobs/program-manager-lifenet-international/", src: "JobWeb Uganda" },
  { type: "job", title: "Regional Team Lead", org: "FHI 360", loc: "Uganda", profession: null, deadline: null, url: "https://jobwebuganda.com/jobs/regional-team-lead-fhi-360/", src: "JobWeb Uganda" },

  // --- Jobs: MUJHU / IDI / Baylor (from search results, specific named postings) ---
  { type: "job", title: "Epidemiologist (4 positions)", org: "Baylor College of Medicine Children's Foundation Uganda", loc: "Uganda", profession: "Public Health", deadline: null, url: "https://theugandanjobline.com/2026/05/epidemiologist-4-positions-jobs-baylor-uganda.html", src: "The Ugandan Jobline" },
  { type: "job", title: "District Program Officer, HIV/AIDS/TB", org: "Baylor College of Medicine Children's Foundation Uganda", loc: "Uganda", profession: "Public Health", deadline: null, url: "https://theugandanjobline.com/2026/03/district-program-officer-hiv-aids-tb-jobs-baylor-uganda.html", src: "The Ugandan Jobline" },
  { type: "fellowship", title: "MSc Fellow (2 positions), AI for Malaria Surveillance (AIMaR/Google-funded)", org: "African Centre of Excellence in Bioinformatics, Infectious Diseases Institute (Makerere)", loc: "Kampala", profession: null, deadline: null, url: "https://www.jobspaceuganda.com/2026/05/masters-fellow-02-jobs-at-infectious.html", src: "JobSpace Uganda" },
  { type: "fellowship", title: "PhD Fellow (2 positions), AI for Malaria Surveillance (AIMaR/Google-funded)", org: "African Centre of Excellence in Bioinformatics, Infectious Diseases Institute (Makerere)", loc: "Kampala", profession: null, deadline: null, url: "https://www.jobspaceuganda.com/2026/05/phd-fellow-02-jobs-at-infectious.html", src: "JobSpace Uganda" },
  { type: "job", title: "Vacancies and internships", org: "MUJHU Research Collaboration", loc: "Kampala", profession: null, deadline: null, url: "https://openhrms.mujhu.org/jobs", summary: "Live openings portal for MUJHU, a Makerere University–Johns Hopkins University research collaboration on maternal, child and adolescent HIV/infectious disease treatment.", src: "MUJHU Research Collaboration" },

  // --- Jobs: UNMC regulator ---
  { type: "job", title: "Education and Registration Officer (fresher)", org: "Uganda Nurses and Midwives Council (UNMC)", loc: "Kampala", profession: "Nurse / Midwife", deadline: null, url: "https://theugandanjobline.com/2025/07/education-and-registration-officer-fresher-jobs-jobs-uganda-nurses-and-midwives-council-unmc.html", src: "The Ugandan Jobline" },

  // --- Grants ---
  { type: "grant", title: "Local Partnerships for Global Health Security (Uganda)", org: "U.S. Centers for Disease Control and Prevention (CDC)", loc: "Uganda", profession: "Public Health", deadline: "2026-08-14", url: "https://www2.fundsforngos.org/individuals/apply-now-local-partnerships-for-global-health-security-uganda/", summary: "~US$5 million programme supporting Uganda's capacity for public health emergency management, surveillance, laboratory systems and workforce development. Open to universities, NGOs, government agencies and businesses.", src: "fundsforNGOs" },
  { type: "grant", title: "Grand Challenges Grant Opportunity", org: "Gates Foundation / Grand Challenges", loc: "Uganda (global programme)", profession: null, deadline: "2026-06-16", url: "https://chs.mak.ac.ug/opportunity/grand-challenges-grant-opportunity", src: "Makerere College of Health Sciences" },

  // --- Scholarships / fellowships (recurring national programmes, no fixed date, they reopen annually) ---
  { type: "scholarship", title: "Chevening Scholarship (Uganda)", org: "UK Foreign, Commonwealth & Development Office", loc: "UK (for Ugandan applicants)", profession: null, deadline: null, url: "https://www.chevening.org/scholarship/uganda/", summary: "Fully-funded UK master's scholarship for future leaders, open to Ugandan applicants including health professionals; applications typically open around August and close around November each year.", src: "Chevening" },
  { type: "scholarship", title: "Commonwealth Scholarships (Uganda)", org: "UK Commonwealth Scholarship Commission / British Council Uganda", loc: "UK (for Ugandan applicants)", profession: null, deadline: null, url: "https://www.britishcouncil.ug/study-uk/funding/commonwealth-scholarships", summary: "Postgraduate scholarships and fellowships for Commonwealth citizens including Uganda; over 800 awarded annually across all fields including health.", src: "British Council Uganda" },
  { type: "scholarship", title: "Commonwealth Shared Scholarship, MSc Public Health for Global Practice", org: "London School of Hygiene & Tropical Medicine", loc: "UK (for Ugandan applicants)", profession: "Public Health", deadline: null, url: "https://www.lshtm.ac.uk/study/fees-and-funding/funding-scholarships/2026-27-commonwealth-shared-scholarships-phgp", summary: "Fully-funded MSc Public Health for Global Practice at LSHTM for candidates from eligible Commonwealth developing countries including Uganda; annual cycle.", src: "LSHTM" },
  { type: "fellowship", title: "Fulbright–Fogarty Fellowship in Public Health (Uganda)", org: "Fulbright Program / NIH Fogarty International Center", loc: "Uganda", profession: "Public Health", deadline: null, url: "https://us.fulbrightonline.org/countries/sub-saharan-africa/uganda/1920", summary: "Year-long research fellowship for US doctoral/health-professional students to conduct mentored public health research at an approved Uganda site; Uganda-based mentors/institutions participate as hosts.", src: "Fulbright" },
  { type: "fellowship", title: "Fogarty LAUNCH Global Health Research Training Program", org: "NIH Fogarty International Center", loc: "Uganda (one of several partner sites)", profession: null, deadline: null, url: "https://www.fic.nih.gov/Programs/Pages/scholars-fellows-global-health.aspx", summary: "One year of mentored global health research training for postdoctoral trainees and health-professional students, with Uganda as one of the approved international sites.", src: "NIH Fogarty International Center" },
  { type: "scholarship", title: "Mastercard Foundation Scholars Program at Makerere University", org: "Mastercard Foundation / Makerere University", loc: "Kampala", profession: null, deadline: null, url: "https://www.mak.ac.ug/tags/55", summary: "Renewed partnership funding master's-level scholarships at Makerere, including health-related programmes, through 2034.", src: "Makerere University" },

  // --- Makerere College of Health Sciences: live, currently-open calls (dated items with a 2026 deadline, or clearly rolling/no stale date) ---
  { type: "fellowship", title: "EnRiCH Master's Degree Fellowships in Sickle Cell Disease and Related NCDs", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-enrich-masters-degree-fellowships-sickle-cell-disease-and-related", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "EnRiCH Non-Degree Research Fellowships in Sickle Cell Disease", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-enrich-non-degree-research-fellowships-sickle-cell-disease-scd-and", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Post-Doctoral Fellowship in Biostatistics, SUPPORT Project", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-post-doctoral-fellowship-biostatistics-support-project-makerere", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Research Thesis Support in Epilepsy Research (2026/2027 Cohort)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-research-thesis-support-epilepsy-research-20262027-cohort", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Clinical Sub-Specialty Fellowship Training, Paediatric Haematology/Oncology and Neonatology", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Doctor", deadline: null, url: "https://chs.mak.ac.ug/opportunity/opportunity-clinical-sub-specialty-fellowship-training-programmes", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Research Support, Drug Safety Science", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-research-support", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "SURGE Project PhD Fellowship, Host Genetics of Pediatric HIV", org: "Makerere University College of Health Sciences / Baylor College of Medicine", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-surge-project-phd-fellowship-2026", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "IMPACT Master's Research Fellowship", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-impact-masters-research-fellowship-2026", src: "Makerere College of Health Sciences" },
  { type: "scholarship", title: "Master's Scholarship, Epidemiology & Biostatistics / Public Health in Sepsis", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Public Health", deadline: null, url: "https://chs.mak.ac.ug/opportunity/scholarship-opportunity-masters-epidemiology-biostatistics-and-public-health-area", src: "Makerere College of Health Sciences" },
  { type: "training", title: "Eastern Africa FAIMER Regional Institute (EAFRI) 2026", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-2026-applications-eastern-africa-faimer-regional-institute-eafri", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Administrator, ICER Secretariat", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/job-opportunity-administrator-icer-secretariat", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "PhD Degree Fellows in NCD-Related Research", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-phd-degree-fellows-ncds-related-research", src: "Makerere College of Health Sciences" },
  { type: "training", title: "Master's Training Opportunity (MakNCD)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-training-opportunity", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "International Fellows Recruitment, Wellcome Sanger Institute", org: "Makerere University College of Health Sciences / Wellcome Sanger Institute", loc: "Kampala / UK", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/international-fellows-recruitment-wellcome-sanger-institute", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "SANTHE Master's and PhD Training, HIV Cure and TB Elimination", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-santhe-masters-and-phd-training-opportunity", src: "Makerere College of Health Sciences" },
  { type: "training", title: "Training Support in Behavioral and Social Science Research (BSSR)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-training-support-behavioral-and-social-science-research-bssr", src: "Makerere College of Health Sciences" },
  { type: "training", title: "Hands-On Manuscript Writing Workshop for Nurses and Midwives in Uganda", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Nurse / Midwife", deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-participation-hands-manuscript-writing-workshop-nurses-and-midwives-uganda", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "NIHR PhD Studentships in Anthropology of Diagnostics (Infectious & Non-Communicable Diseases)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/nihr-phd-studentships-anthropology-diagnostics-infectious-and-non-communicable-diseases", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "James M. Ntambi Postdoctoral Fellowship", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-james-m-ntambi-postdoctoral-fellowship", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "PhD Scholarship, Impact of Food Supplementation on Health and Growth", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Nutrition / Dietetics", deadline: null, url: "https://chs.mak.ac.ug/opportunity/phd-scholarship-fellowship-training-impact-food-supplementation-health-growth-and", src: "Makerere College of Health Sciences" },
  { type: "scholarship", title: "Master's Scholarship, Faculty Initiated Ideas (Biomedical Engineering)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/masters-scholarship-opportunities-call-applications-faculty-initiated-ideas", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Clinical Sub-Specialty Training Fellowships, Paediatric Haematology and Neonatology", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Doctor", deadline: null, url: "https://chs.mak.ac.ug/opportunity/invitation-applications-clinical-sub-specialty-training-fellowships-paediatric", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Support, Reducing Stroke Risk Factors", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-support-reducing-stroke-risk-factors-1", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Non-Degree Fellows in Sickle Cell Disease and Related NCDs", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-non-degree-fellows-sickle-cell-disease-and-related-ncds", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Degree Fellows in Sickle Cell Disease and Related NCDs", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-degree-fellows-scd-and-related-ncds", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Support, Self-Management Intervention for Reducing Epilepsy Burden", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-support-self-management-intervention-reducing-epilepsy-0", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Research Fellowships, Rheumatic Heart Disease", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-research-fellowships-reducing-impact-rheumatic-heart-disease", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Professor Sewankambo Global Health Security PhD Fellowships", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-professor-sewankambo-global-health-security-phd-fellowships", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Assistant Administrative Officer (REC Administrator)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/job-opportunity-assistant-administrative-officer-rec-administrator", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Research Assistants", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/vacancy-announcement-research-assistants", src: "Makerere College of Health Sciences" },
  { type: "training", title: "International Student Training & Exchange Program (iSTEP)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/international-student-training-exchange-program-istep-three-simultaneous-courses", src: "Makerere College of Health Sciences" },
  { type: "job", title: "PhD Student Position, SUPPORT Project (ESC6)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-1-phd-student-position-available-makerere-university-kampala-uganda", src: "Makerere College of Health Sciences" },
  { type: "job", title: "PhD Student Position, SUPPORT Project (ESC1)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-1-phd-student-position-available-makerere-university-kampala-uganda-0", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Master's Support in Brain Health", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Mental Health", deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-masters-support-brain-health-0", src: "Makerere College of Health Sciences" },
  { type: "training", title: "Makerere University – Yale University Rheumatology CPD Series", org: "Makerere University College of Health Sciences / Yale University", loc: "Kampala", profession: "Doctor", deadline: null, url: "https://chs.mak.ac.ug/opportunity/makerere-university-yale-university-rheumatology-cpd-series", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "AWE Change Master's Fellowship Programme Support", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-application-awe-change-masters-fellowship-programme-support", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "Joint Postdoctoral Fellowship in Global Health Ethics", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-joint-postdoctoral-fellowship-global-health-ethics", src: "Makerere College of Health Sciences" },
  { type: "training", title: "MISH, Managing Innovation for Sustainable Health Training Program", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-mish-managing-innovation-sustainable-health-training-program-managers", src: "Makerere College of Health Sciences" },
  { type: "fellowship", title: "CARTA PhD Fellowships, Cohort 11", org: "Makerere University College of Health Sciences / CARTA", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/call-applications-carta-phd-fellowships-2025-cohort-11", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Study Nurse (iTECH Project)", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Nurse / Midwife", deadline: null, url: "https://chs.mak.ac.ug/opportunity/vacancy-study-nurse-01-itech-projects", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Data Officers (2 positions), iTECH Project", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/vacancies-itech-projects-02-data-officers", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Data Manager, iTECH Project", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: null, deadline: null, url: "https://chs.mak.ac.ug/opportunity/vacancy-data-manager-01-itech-project", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Study Midwife", org: "Makerere University College of Health Sciences", loc: "Kampala", profession: "Nurse / Midwife", deadline: null, url: "https://chs.mak.ac.ug/opportunity/vacancy-study-midwife", src: "Makerere College of Health Sciences" },
  { type: "job", title: "Psychiatric Nurse, Cango Lyec Program", org: "Makerere University College of Health Sciences", loc: "Uganda", profession: "Mental Health", deadline: null, url: "https://chs.mak.ac.ug/opportunity/vacancy-announcement-psychiatric-nurse-cango-lyec-program", src: "Makerere College of Health Sciences" },
];

// --- map to posts columns ---------------------------------------------------
const seen = new Set();
const rows = [];
for (const r of raw) {
  if (r.deadline && r.deadline < TODAY) continue; // stale, skip
  const slug = slugify(r.title, r.org);
  if (seen.has(slug)) continue; // dedupe
  seen.add(slug);
  // schema's `type` check constraint doesn't include "training", map to "other".
  const type = r.type === "training" ? "other" : r.type;
  const summary = r.summary ?? `${r.title} at ${r.org}${r.loc ? `, ${r.loc}` : ""}.`;
  rows.push([
    slug,
    type,
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
    `${summary} See the application link for full details, requirements and how to apply.`, // description
    summary,
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
  const c = await client.query("select count(*)::int n from public.posts where status='published'");
  console.log(`Done ✅  inserted/updated ${inserted} rows. Published posts in DB: ${c.rows[0].n}`);
} finally {
  await client.end();
}
