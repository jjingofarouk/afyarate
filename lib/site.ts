export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ratemusawo.online";
export const SITE_NAME = "Medical Opportunities Hub Uganda";
export const SITE_DESCRIPTION =
  "The home for Uganda's health workers. Find verified practitioners, rated facilities, and current jobs and opportunities across Uganda.";
export const PAGE_SIZE = 12;

// Support contacts shown to claimed practitioners. Set
// NEXT_PUBLIC_SUPPORT_WHATSAPP (E.164, digits only) in your env.
export const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "256700000000";
export const SUPPORT_WHATSAPP_LINK = `https://wa.me/${SUPPORT_WHATSAPP}`;
export const SUPPORT_EMAIL_LINK = "/contact";

// Direct dispatch + hiring line answered by the Medical Opportunities Hub Uganda team. Shown on
// the home page emergency (ambulance) and recruiter (hiring) sections.
export const DISPATCH_PHONE_DISPLAY = "+256 751 360385";
export const DISPATCH_PHONE_LINK = "tel:+256751360385";
export const HIRING_EMAIL = "jobsopportunityug@gmail.com";
export const HIRING_EMAIL_LINK = `mailto:${HIRING_EMAIL}?subject=${encodeURIComponent("Hiring health workers via Medical Opportunities Hub Uganda")}`;
export const NEWSLETTER_AUDIENCE_SIZE = "50,000+";
