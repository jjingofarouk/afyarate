export interface EditorialLink {
  label: string;
  href: string;
}

export interface EditorialSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface EditorialArticle {
  slug: string;
  category: "Guide" | "News" | "Stats";
  title: string;
  summary: string;
  updated: string;
  readTime: string;
  links: EditorialLink[];
  sections: EditorialSection[];
}

export const EDITORIAL_ARTICLES: EditorialArticle[] = [
  {
    slug: "umdpc-registration-guide",
    category: "Guide",
    title: "UMDPC registration: how to verify a licence in Uganda",
    summary:
      "Use the official registry data to verify a practitioner by name, registration number or licence number before a visit.",
    updated: "17 August 2026",
    readTime: "5 min read",
    links: [
      { label: "Verify practitioners", href: "/practitioners?q=" },
      { label: "Doctors in Uganda", href: "/practitioners/profession/doctor" },
      { label: "Nurses in Uganda", href: "/practitioners/profession/nurse-midwife" },
    ],
    sections: [
      {
        heading: "What the registry tells you",
        paragraphs: [
          "The UMDPC registry is most useful when you need to confirm that a practitioner is actually licensed and currently active. The profile page should show the council, registration number, licence number and licence expiry date in one place.",
          "If you are comparing practitioners, start with the search page and then open the full profile for the person you want to verify.",
        ],
      },
      {
        heading: "How to check a licence quickly",
        paragraphs: [
          "Search by the practitioner's name, registration number or licence number. If the record is active, the practitioner page should show an active licence badge and the supporting registration details.",
        ],
        bullets: [
          "Use the name first if you only know how the person is listed publicly.",
          "Use the licence number if you want the fastest exact match.",
          "Open the profile and confirm the council, registration status and expiry date before relying on the record.",
        ],
      },
      {
        heading: "Why this page matters for SEO",
        paragraphs: [
          "This landing page is designed to win the high-intent searches people use when they want to verify a doctor, nurse, pharmacist or allied health worker in Uganda. Every path on the site points back to the registry pages that users actually need.",
        ],
      },
    ],
  },
  {
    slug: "how-to-become-a-doctor-in-uganda",
    category: "Guide",
    title: "How to become a doctor in Uganda",
    summary:
      "A practical guide covering medical school, internship, registration, career paths and where to work.",
    updated: "17 August 2026",
    readTime: "7 min read",
    links: [
      { label: "Licensed doctors", href: "/practitioners/profession/doctor" },
      { label: "Doctor jobs", href: "/professions/doctor" },
      { label: "Medical jobs", href: "/jobs/doctor" },
    ],
    sections: [
      {
        heading: "Typical pathway",
        paragraphs: [
          "In Uganda, the usual path is medical school, internship, registration and then ongoing professional development. The exact route depends on the university programme and the council requirements in force when you qualify.",
        ],
        bullets: [
          "Complete the required medical degree.",
          "Finish internship or supervised training where applicable.",
          "Register with the relevant council and keep your licence current.",
          "Continue with CPD, specialty training or postgraduate study if you want to advance.",
        ],
      },
      {
        heading: "Where doctors work",
        paragraphs: [
          "Doctors work in public hospitals, private hospitals, clinics, universities, NGOs and research institutions. The live job board shows which organisations are recruiting right now.",
        ],
      },
    ],
  },
  {
    slug: "nursing-in-uganda-career-path-salary",
    category: "Guide",
    title: "Nursing in Uganda: career path and salary signals",
    summary:
      "Use live job listings to understand where nurses work, how they progress and what salary ranges are being advertised now.",
    updated: "17 August 2026",
    readTime: "6 min read",
    links: [
      { label: "Licensed nurses", href: "/practitioners/profession/nurse-midwife" },
      { label: "Nurse jobs", href: "/jobs/nurse-midwife" },
      { label: "All nursing roles", href: "/professions/nurse-midwife" },
    ],
    sections: [
      {
        heading: "Career path",
        paragraphs: [
          "A nursing career in Uganda typically starts with an accredited training programme, followed by council registration and then work in facilities, wards, community programmes or specialist units.",
        ],
        bullets: [
          "Check the exact cadre you are training for, because entry requirements vary.",
          "Keep your practising licence current once you enter the workforce.",
          "Use the job board to see which employers are hiring nurses and midwives today.",
        ],
      },
      {
        heading: "Salary signals",
        paragraphs: [
          "Salary information on the job board gives a real-time signal of what employers are offering, which is often more useful than a generic salary guide.",
        ],
      },
    ],
  },
  {
    slug: "uganda-health-facilities-directory",
    category: "News",
    title: "Uganda health facilities directory: hospitals and pharmacies by location",
    summary:
      "A location-first directory that helps users browse hospitals and pharmacies in cities and districts across Uganda.",
    updated: "17 August 2026",
    readTime: "4 min read",
    links: [
      { label: "Facilities directory", href: "/facilities" },
      { label: "Hospitals in Kampala", href: "/facilities/hospital/kampala" },
      { label: "Pharmacies in Kampala", href: "/facilities/pharmacy/kampala" },
    ],
    sections: [
      {
        heading: "What people search for",
        paragraphs: [
          "Users usually want the nearest hospital, a trusted pharmacy or a way to compare options in one place. This is why the facility directory is organised by kind and by city.",
        ],
      },
      {
        heading: "Why location pages matter",
        paragraphs: [
          "Pages for a specific city or district help people find care faster and give search engines a clear local landing page to rank.",
        ],
      },
    ],
  },
  {
    slug: "uganda-health-workforce-statistics",
    category: "Stats",
    title: "Uganda health workforce statistics and what the data can show",
    summary:
      "A national dashboard for practitioners, patient ratings, facilities and job openings, with location pages for the busiest markets.",
    updated: "17 August 2026",
    readTime: "5 min read",
    links: [
      { label: "Uganda stats", href: "/stats/uganda" },
      { label: "Practitioner hub", href: "/practitioners" },
      { label: "Job board", href: "/jobs" },
    ],
    sections: [
      {
        heading: "National overview",
        paragraphs: [
          "The national stats page combines the practitioner registry, facilities directory and live jobs board so readers can see the shape of the market at a glance.",
        ],
      },
      {
        heading: "Location pages",
        paragraphs: [
          "The same pattern works at city level. A page for Kampala, Jinja or Mbarara can surface the open roles, facilities and directory listings people care about most.",
        ],
      },
    ],
  },
];

export function getEditorialArticles(): EditorialArticle[] {
  return [...EDITORIAL_ARTICLES];
}

export function getEditorialArticle(slug: string): EditorialArticle | null {
  return EDITORIAL_ARTICLES.find((article) => article.slug === slug) ?? null;
}

