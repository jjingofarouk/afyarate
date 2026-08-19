export interface HelpBlock {
  type: "p" | "h2" | "ul" | "note";
  text?: string;
  items?: string[];
}

export interface HelpArticle {
  slug: string;
  collection: string;
  title: string;
  summary: string;
  updated: string;
  related: string[];
  blocks: HelpBlock[];
}

export const HELP_COLLECTIONS: string[] = [
  "Getting Started",
  "Ratings & Reviews",
  "Licensing Data",
  "Data & Privacy",
  "Jobs & Opportunities",
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "what-is-rate-musawo",
    collection: "Getting Started",
    title: "What is Rate Musawo?",
    summary:
      "Rate Musawo is a free directory of Uganda's licensed health professionals, with patient ratings and a healthcare job board.",
    updated: "6 August 2026",
    related: ["how-does-rate-musawo-work", "is-rate-musawo-free", "is-rate-musawo-a-healthcare-provider"],
    blocks: [
      {
        type: "p",
        text: "Rate Musawo is a free, independent website that helps patients in Uganda find licensed doctors, nurses, pharmacists and allied health workers and learn from other patients' experiences before choosing where to seek care.",
      },
      { type: "h2", text: "What you can do on Rate Musawo" },
      {
        type: "ul",
        items: [
          "Search every licensed practitioner in the registry by name, profession or location, and check their registration and licence status.",
          "Read patient ratings and leave your own 1–5 star rating with a short comment.",
          "Browse the Jobs & Opportunities board for healthcare jobs, internships, scholarships, grants and fellowships in Uganda.",
        ],
      },
      { type: "h2", text: "Where does the name come from?" },
      {
        type: "p",
        text: "Musawo is the Luganda word for health worker. The site was built by a Ugandan doctor to make it easier for patients to verify that a practitioner is licensed before they book.",
      },
      {
        type: "note",
        text: "Rate Musawo is not operated by, or affiliated with, any medical council or the Government of Uganda. Licensing data is republished from official council sources. See [Where does the licensing data come from?](/help/where-does-the-data-come-from)",
      },
    ],
  },
  {
    slug: "how-does-rate-musawo-work",
    collection: "Getting Started",
    title: "How does Rate Musawo work?",
    summary:
      "From the homepage you can search the registry, open a practitioner's profile to check their licence status and read ratings, and leave your own review.",
    updated: "6 August 2026",
    related: ["what-is-rate-musawo", "how-do-i-rate-a-health-worker", "how-we-verify-health-professionals"],
    blocks: [
      {
        type: "p",
        text: "Using Rate Musawo is simple and free. To get started, go to the homepage and type a practitioner's name, profession or location into the search box. You can also filter the results by profession and by council.",
      },
      { type: "h2", text: "Open a practitioner's profile" },
      {
        type: "p",
        text: "Each profile shows the practitioner's registration details: their council, registration number, licence number and licence expiry date, exactly as published by the official registry. Below that you'll find the average patient rating and the individual reviews left by patients.",
      },
      { type: "h2", text: "Leave a rating" },
      {
        type: "p",
        text: "Anyone can rate a practitioner from 1 to 5 stars and leave a short comment. You don't need an account. Just open the profile and submit the form. Ratings appear publicly on the profile.",
      },
      { type: "h2", text: "Browse the job board" },
      {
        type: "p",
        text: "The Jobs & Opportunities section lists healthcare jobs, internships, scholarships, grants and fellowships, mostly for health professionals in Uganda. Each listing links to the original source where you can apply.",
      },
    ],
  },
  {
    slug: "is-rate-musawo-free",
    collection: "Getting Started",
    title: "Is Rate Musawo free?",
    summary:
      "Yes. Searching the registry, reading ratings and submitting reviews on Rate Musawo are 100% free for patients.",
    updated: "6 August 2026",
    related: ["what-is-rate-musawo", "is-rate-musawo-a-healthcare-provider"],
    blocks: [
      {
        type: "p",
        text: "Yes! Searching for practitioners, viewing profiles, reading ratings and submitting your own review is completely free. You never need to pay to use Rate Musawo.",
      },
      {
        type: "p",
        text: "Any fees you pay to see a doctor are between you and the facility or practitioner, not Rate Musawo. We don't book appointments, handle payments, or set consultation prices.",
      },
      {
        type: "note",
        text: "If you are ever asked to pay to use Rate Musawo itself, that request did not come from us. Please report it via the contact page.",
      },
    ],
  },
  {
    slug: "where-is-rate-musawo-available",
    collection: "Getting Started",
    title: "Where is Rate Musawo available?",
    summary:
      "Rate Musawo covers Uganda's national registry of licensed health professionals, and the job board focuses on healthcare opportunities in Uganda.",
    updated: "6 August 2026",
    related: ["what-is-rate-musawo", "how-does-rate-musawo-work"],
    blocks: [
      {
        type: "p",
        text: "Rate Musawo covers the national registry of health professionals licensed to practise in Uganda, published by the Uganda Medical & Dental Practitioners Council (UMPDC), the Uganda Nurses & Midwives Council, and the Allied Health Professionals Council.",
      },
      {
        type: "p",
        text: "The Jobs & Opportunities board focuses on opportunities for healthcare professionals in Uganda, though international fellowships, scholarships and conferences relevant to Ugandan health workers are also listed.",
      },
      {
        type: "p",
        text: "The website itself is accessible from anywhere in the world, so patients and health workers abroad can also search the registry.",
      },
    ],
  },
  {
    slug: "is-rate-musawo-a-healthcare-provider",
    collection: "Getting Started",
    title: "Is Rate Musawo a healthcare provider?",
    summary:
      "No. Rate Musawo is an independent directory and rating site, it does not provide medical care, diagnoses or treatment advice.",
    updated: "6 August 2026",
    related: ["how-we-verify-health-professionals", "reviews-faq"],
    blocks: [
      {
        type: "p",
        text: "No. Rate Musawo is not a healthcare provider. It is an independent directory that republishes licensing information from official Ugandan councils and hosts patient ratings. It does not employ practitioners, provide medical services, or offer treatment.",
      },
      {
        type: "p",
        text: "Ratings and comments on the site reflect the personal experiences of patients. They are opinions, not medical advice, not an endorsement, and not a measure of a practitioner's clinical competence.",
      },
      { type: "h2", text: "Questions about your treatment" },
      {
        type: "p",
        text: "If you have questions about a treatment plan, prescriptions, lab results or medical records, contact the doctor's clinic directly. Rate Musawo cannot help with medical questions, book appointments, or answer for individual practitioners.",
      },
      {
        type: "note",
        text: "In an emergency, contact a medical facility immediately or call emergency services. Do not rely on an online directory for urgent care decisions.",
      },
    ],
  },
  {
    slug: "who-writes-the-reviews",
    collection: "Ratings & Reviews",
    title: "Who writes the reviews on Rate Musawo?",
    summary:
      "Ratings are written by patients and members of the public about their own experiences. Each profile shows the average rating and the individual comments.",
    updated: "6 August 2026",
    related: ["how-do-i-rate-a-health-worker", "reviews-faq"],
    blocks: [
      {
        type: "p",
        text: "Ratings on Rate Musawo are written by patients and members of the public about their own experiences with a health worker. Anyone can rate a practitioner, you don't need an account, so the feedback reflects a broad range of patient experiences.",
      },
      { type: "h2", text: "What appears on a profile" },
      {
        type: "ul",
        items: [
          "An average star rating (1–5) calculated from all submitted ratings.",
          "The number of ratings received, so you can see how representative the average is.",
          "Individual comments, shown with the display name the reviewer chose (or as 'Anonymous' if they left the name field blank).",
        ],
      },
      { type: "h2", text: "Ratings are community opinions" },
      {
        type: "p",
        text: "Ratings are not fact-checked or endorsed by Rate Musawo, and they are not a measure of a practitioner's clinical competence. They reflect subjective experience, communication, professionalism, wait times, and should be read as one signal among many, alongside the practitioner's licence status and your own judgement.",
      },
    ],
  },
  {
    slug: "how-do-i-rate-a-health-worker",
    collection: "Ratings & Reviews",
    title: "How do I rate a health worker?",
    summary:
      "Open the practitioner's profile, pick 1–5 stars, optionally add a comment and display name, then submit. It takes under a minute and needs no account.",
    updated: "6 August 2026",
    related: ["who-writes-the-reviews", "reviews-faq", "how-to-write-a-helpful-review"],
    blocks: [
      {
        type: "p",
        text: "Rating a health worker takes less than a minute and does not require an account. Here's how:",
      },
      {
        type: "ul",
        items: [
          "Find the practitioner using the search box on the homepage, or browse the registry.",
          "Open their profile page and scroll to the 'Rate this health worker' form.",
          "Select a star rating from 1 to 5.",
          "Optionally add a short comment (up to 1,000 characters) and a display name.",
          "Click 'Submit rating'.",
        ],
      },
      { type: "h2", text: "Your review is public" },
      {
        type: "p",
        text: "Once submitted, your rating is displayed publicly on the practitioner's profile. If you leave the name field blank, it will appear as 'Anonymous'. Do not include your real name, contact details, or anything you would not want to be public unless you intend it to be.",
      },
      { type: "h2", text: "Can I edit or remove my review?" },
      {
        type: "p",
        text: "Ratings are not linked to an account, so there is no self-service edit. If you need a rating corrected or removed, for example because it contains something you did not intend to make public, contact us with the practitioner's profile URL and the details of the review, and we will review the request.",
      },
    ],
  },
  {
    slug: "how-to-write-a-helpful-review",
    collection: "Ratings & Reviews",
    title: "How to write a helpful review",
    summary:
      "Keep it relevant, specific and objective. Focus on your experience, communication, professionalism, wait times, not on diagnoses or treatment accuracy.",
    updated: "6 August 2026",
    related: ["how-do-i-rate-a-health-worker", "reviews-faq"],
    blocks: [
      {
        type: "p",
        text: "A good review helps other patients make better decisions. Here are a few tips for writing one that is fair, useful and stays within our guidelines:",
      },
      {
        type: "ul",
        items: [
          "Keep it relevant, focus on the things you as a patient would most want to know: communication, professionalism, wait times, bedside manner.",
          "Be specific, explain what you were looking for and how the practitioner did, rather than just saying 'great' or 'bad'.",
          "Stay objective, describe your feelings about the care you received, but avoid making claims about whether a diagnosis or treatment was medically accurate.",
          "Keep it concise, a short paragraph or two is plenty.",
          "Don't guess, avoid speculating about why a practitioner did or didn't do something.",
        ],
      },
      {
        type: "note",
        text: "We don't publish reviews that are profane, defamatory, contain another person's private information, promote unrelated products or services, or make claims about treatment accuracy we cannot verify.",
      },
    ],
  },
  {
    slug: "reviews-faq",
    collection: "Ratings & Reviews",
    title: "Reviews FAQ",
    summary:
      "How ratings are collected, moderated and displayed, and why a review might not be posted.",
    updated: "6 August 2026",
    related: ["who-writes-the-reviews", "how-do-i-rate-a-health-worker", "how-to-write-a-helpful-review"],
    blocks: [
      { type: "h2", text: "Why should I trust the reviews on Rate Musawo?" },
      {
        type: "p",
        text: "Reviews are written by real patients about their own experiences, and we publish positive, negative and in-between feedback. That said, ratings are community opinions, they are not independently verified, so read them as one signal alongside licence status and your own judgement.",
      },
      { type: "h2", text: "Does Rate Musawo only post positive reviews?" },
      {
        type: "p",
        text: "No. We publish the full range of patient feedback. There is no payment, affiliation or relationship with practitioners that would bias what is shown, and practitioners cannot have reviews removed simply because they are negative.",
      },
      { type: "h2", text: "Are reviews moderated?" },
      {
        type: "p",
        text: "We review reported content and may remove reviews that violate our guidelines, profanity, hate speech, personal information, defamation, or claims about treatment accuracy. Most reviews appear immediately and are reviewed if reported.",
      },
      { type: "h2", text: "When will a review not be posted?" },
      {
        type: "ul",
        items: [
          "Profanity, vulgarity or offensive content.",
          "Another person's private information, full names, phone numbers, addresses, medical details.",
          "Defamatory claims, including implying criminal conduct or professional misconduct without a reasonable basis.",
          "Promotional content, spam or links to unrelated products.",
          "Claims about the accuracy of a treatment or diagnosis, which we cannot verify.",
          "Duplicate or fake reviews submitted to manipulate a rating.",
        ],
      },
      { type: "h2", text: "Can I review anonymously?" },
      {
        type: "p",
        text: "Yes. Leave the display name field blank and your rating will appear as 'Anonymous'.",
      },
      { type: "h2", text: "Can I edit my review?" },
      {
        type: "p",
        text: "Ratings are not linked to accounts, so there's no self-service editing. Contact us with the profile URL and review details if you need a correction or removal.",
      },
    ],
  },
  {
    slug: "how-we-verify-health-professionals",
    collection: "Licensing Data",
    title: "How we verify licensed health professionals",
    summary:
      "Licence status and registration details are republished from official Ugandan councils, so you can check a practitioner's status before you book.",
    updated: "6 August 2026",
    related: ["where-does-the-data-come-from", "what-if-information-is-wrong", "is-rate-musawo-a-healthcare-provider"],
    blocks: [
      {
        type: "p",
        text: "The registry on Rate Musawo is built from official licensing data published by the Uganda Medical & Dental Practitioners Council (UMPDC), the Uganda Nurses & Midwives Council, and the Allied Health Professionals Council.",
      },
      { type: "h2", text: "What each profile shows" },
      {
        type: "ul",
        items: [
          "The council the practitioner is registered with.",
          "Their profession and registration number.",
          "Their licence number and licence expiry date.",
          "Their registration / licence status as published by the council.",
        ],
      },
      { type: "h2", text: "How current is the data?" },
      {
        type: "p",
        text: "We refresh the registry regularly from the councils' published data, but there can be a delay between a change at the source and it appearing on the site. The information is shown exactly as published by the portal and may lag the councils' records.",
      },
      {
        type: "note",
        text: "For decisions that really matter, emergencies, legal or credentialing purposes, always verify a practitioner's current licence status directly with the relevant council.",
      },
    ],
  },
  {
    slug: "where-does-the-data-come-from",
    collection: "Licensing Data",
    title: "Where does the data come from?",
    summary:
      "Licensing data comes from official Ugandan regulator portals; ratings come from patients. Each has different reliability characteristics.",
    updated: "6 August 2026",
    related: ["how-we-verify-health-professionals", "what-if-information-is-wrong"],
    blocks: [
      {
        type: "p",
        text: "Rate Musawo combines two kinds of information with very different sources:",
      },
      { type: "h2", text: "Licensing data, from official councils" },
      {
        type: "p",
        text: "Registration and licence details are copied from data published by the Uganda Medical & Dental Practitioners Council (UMPDC), the Uganda Nurses & Midwives Council, and the Allied Health Professionals Council. We republish this data for convenience but do not independently verify it, and it may be delayed or contain errors from the source.",
      },
      { type: "h2", text: "Ratings, from patients" },
      {
        type: "p",
        text: "Ratings and comments are submitted by patients about their own experiences. They are not fact-checked or endorsed by us, and they are opinions rather than facts.",
      },
      { type: "h2", text: "Listings, from the source organizations" },
      {
        type: "p",
        text: "Job and opportunity listings are gathered from the websites of the organizations that post them, with a link back to the original source for applying.",
      },
    ],
  },
  {
    slug: "what-if-information-is-wrong",
    collection: "Licensing Data",
    title: "What if information about me is wrong?",
    summary:
      "If you're a practitioner and a fact on your profile is incorrect, contact us to review it, and raise the correction with the council that publishes it.",
    updated: "6 August 2026",
    related: ["where-does-the-data-come-from", "how-we-verify-health-professionals"],
    blocks: [
      {
        type: "p",
        text: "If you are a practitioner and believe information on your profile is incorrect, out of date, or should not be published, contact us with the profile URL and the detail you believe is wrong. We will review the request and correct it where we can.",
      },
      { type: "h2", text: "Correcting licensing facts" },
      {
        type: "p",
        text: "Because we source licensing data from the councils' published portals, corrections to the underlying facts should also be raised with the relevant council directly. Once the council updates its records, we'll pick up the corrected data on our next refresh.",
      },
      { type: "h2", text: "Reporting a rating" },
      {
        type: "p",
        text: "If a rating about you is false, defamatory or otherwise violates our Terms, report it through the contact page. Include the profile URL, the specific review, and the reason. We review all reports, though we don't guarantee a particular outcome or timeframe.",
      },
    ],
  },
  {
    slug: "how-we-handle-data-and-privacy",
    collection: "Data & Privacy",
    title: "How Rate Musawo handles data and privacy",
    summary:
      "We collect very little: ratings you submit and basic analytics. We don't require accounts and we don't sell personal information.",
    updated: "6 August 2026",
    related: ["how-do-i-rate-a-health-worker", "reviews-faq"],
    blocks: [
      { type: "h2", text: "What data do we collect?" },
      {
        type: "ul",
        items: [
          "Ratings you submit: the 1–5 star rating, any comment, an optional display name, and the profile it's attached to.",
          "Basic analytics: your IP address, browser, pages visited and timestamps, via Google Analytics.",
          "Your theme preference (light/dark), which is stored only on your own device.",
        ],
      },
      { type: "h2", text: "What we don't collect" },
      {
        type: "p",
        text: "We don't require user accounts, so we don't collect passwords, emails, phone numbers or dates of birth from raters. You never have to register to search the registry or submit a rating.",
      },
      { type: "h2", text: "What's public" },
      {
        type: "p",
        text: "Ratings, comments and display names are public by design, they're the core of the site. Only leave a display name or comment you're comfortable having public. If you leave the name blank, your review appears as 'Anonymous'.",
      },
      { type: "h2", text: "How we protect data" },
      {
        type: "ul",
        items: [
          "All traffic is served over HTTPS (encrypted in transit).",
          "The registry and ratings are stored on managed infrastructure with access controls.",
          "We don't sell personal information, and we don't share it with third parties for their marketing.",
        ],
      },
      {
        type: "note",
        text: "This is a summary. The full details are in our Privacy Policy and Terms of Use, which we encourage you to read.",
      },
    ],
  },
  {
    slug: "how-do-i-find-and-apply-to-listings",
    collection: "Jobs & Opportunities",
    title: "How do I find and apply to listings?",
    summary:
      "Browse the job board by type: jobs, internships, scholarships, grants and more, and apply directly at the source organization.",
    updated: "6 August 2026",
    related: ["how-do-i-post-a-listing", "what-is-rate-musawo"],
    blocks: [
      {
        type: "p",
        text: "The Jobs & Opportunities board gathers healthcare opportunities for Ugandan health professionals in one place. You can filter listings by type using the tabs: Jobs, Internships, Scholarships, Grants, Fellowships, Conferences, Opportunities and Other.",
      },
      { type: "h2", text: "Open a listing" },
      {
        type: "p",
        text: "Each listing shows the organization, location, deadline, eligibility and a full description. Most listings include a link to the original source or an application email, apply directly through the organization, not through Rate Musawo.",
      },
      { type: "h2", text: "Is applying free?" },
      {
        type: "p",
        text: "Yes. Browsing and applying for listings is free. We never charge to view or apply to a listing. If an organization asks you to pay to apply, treat it with caution; legitimate employers rarely charge application fees.",
      },
      {
        type: "note",
        text: "Always read the original posting carefully. Rate Musawo aggregates listings for convenience but the organization's own posting is the authoritative source.",
      },
    ],
  },
  {
    slug: "how-do-i-post-a-listing",
    collection: "Jobs & Opportunities",
    title: "How do I post a listing?",
    summary:
      "Use the 'Post a listing' form to submit a job, internship, scholarship, grant or opportunity. Listings are reviewed before publication.",
    updated: "6 August 2026",
    related: ["how-do-i-find-and-apply-to-listings"],
    blocks: [
      {
        type: "p",
        text: "To share a healthcare opportunity, click 'Post a listing' in the navigation (or the button on the Jobs & Opportunities page) and fill in the form: title, type, organization, location, deadline, description and how to apply.",
      },
      { type: "h2", text: "What happens next?" },
      {
        type: "p",
        text: "New listings are reviewed before publication to keep the board useful and free of spam. Once approved, your listing appears on the board and in the relevant type category.",
      },
      { type: "h2", text: "Who can post?" },
      {
        type: "p",
        text: "Anyone: hospitals, clinics, NGOs, universities, government bodies and individuals can post a legitimate healthcare opportunity. Please make sure the details are accurate, since people will be applying for real positions.",
      },
      {
        type: "note",
        text: "We may decline or remove listings that are spam, misleading, or unrelated to healthcare opportunities.",
      },
    ],
  },
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getHelpArticlesByCollection(collection: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.collection === collection);
}

export function getRelatedArticles(slug: string): HelpArticle[] {
  const article = getHelpArticle(slug);
  if (!article) return [];
  return article.related
    .map((s) => getHelpArticle(s))
    .filter((a): a is HelpArticle => Boolean(a));
}
