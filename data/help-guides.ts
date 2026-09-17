export interface GuideSection {
  heading: string;
  body: string;
  points?: string[];
}

export interface HelpGuide {
  slug: string;
  title: string;
  intro: string;
  updated: string;
  sections: GuideSection[];
  related: string[];
}

// Role and safety guides. These keep the legacy URL shape
// (/help/guides/<slug>) so links from the PHP platform keep working.
export const HELP_GUIDES: HelpGuide[] = [
  {
    slug: "jobseekers",
    title: "Jobseeker Guide",
    intro:
      "Use Medical Opportunities Hub Uganda to discover relevant healthcare opportunities and keep your application activity organized.",
    updated: "17 September 2026",
    related: ["safety", "employers"],
    sections: [
      {
        heading: "1. Build your profile",
        body: "Complete your jobseeker profile and keep your professional details current. A complete profile is what lets employers and recruiters find you, not just the other way around.",
        points: [
          "Publish an open-to-work profile from the Jobseekers page.",
          "Choose how much contact detail to share; your CV can stay private, visible to employers only, or public.",
          "Log in so your applications, saves and messages stay linked to you on any device.",
        ],
      },
      {
        heading: "2. Search intelligently",
        body: "Search by keyword and filter by type, profession or cadre, location, organization and deadline. Saving a search is faster than rebuilding the same filters every week.",
      },
      {
        heading: "3. Save useful opportunities",
        body: "Save the listings you want to revisit and set a job alert so new matching roles reach your inbox instead of you hunting for them.",
      },
      {
        heading: "4. Prepare your documents",
        body: "Keep your CV and supporting documents organized in your document vault and check every listing for the exact documents it requires. Name files clearly before you upload them.",
      },
      {
        heading: "5. Apply using the listed method",
        body: "Opportunities on this platform may accept applications on-platform, by email, or through an employer's own website. Follow whichever method the listing specifies — applying the wrong way is the most common avoidable rejection.",
      },
      {
        heading: "6. Track progress",
        body: "Use My Applications for anything submitted through the platform, and watch your notifications for status changes such as shortlisting or interview invitations. Pay attention to deadlines.",
      },
    ],
  },
  {
    slug: "employers",
    title: "Employer Guide",
    intro:
      "Publish clear opportunities, keep an accurate organization profile, and manage applicants from your employer workspace.",
    updated: "17 September 2026",
    related: ["organizations", "jobseekers"],
    sections: [
      {
        heading: "1. Complete your organization profile",
        body: "Use accurate organization identity, contact and profile information. This also supports the verification process, and verified organizations are easier for applicants to trust.",
      },
      {
        heading: "2. Post a complete opportunity",
        body: "Provide a clear title, profession or cadre, location, employment type, requirements, deadline and application instructions.",
        points: [
          "State the application method explicitly: on-platform, email, or your own portal.",
          "Name required documents so applicants do not guess.",
          "Include salary or a salary range where you can — listings that do get more relevant applicants.",
        ],
      },
      {
        heading: "3. Submit for review",
        body: "Opportunities are reviewed before publication. If a listing is rejected, follow the stated reason, edit it and resubmit.",
      },
      {
        heading: "4. Manage applicants",
        body: "For applications submitted through the platform, use the employer workspace to review applicants, open attached documents and move candidates through stages from submitted to hired. Applicants are notified automatically when their status changes.",
      },
      {
        heading: "5. Use plans responsibly",
        body: "Posting availability depends on the active subscription and posting limits configured for the employer account. Contact us if you need your limits adjusted for a large recruitment round.",
      },
    ],
  },
  {
    slug: "organizations",
    title: "Organization Verification Guide",
    intro:
      "Verification helps users distinguish organizations whose profile information has been reviewed by our administrators.",
    updated: "17 September 2026",
    related: ["employers", "safety"],
    sections: [
      {
        heading: "Pending Verification",
        body: "New employer organizations automatically begin as Pending Verification. There is no separate employer request button — it happens when the organization profile is created.",
      },
      {
        heading: "Administrative review",
        body: "Our administrators review the organization profile, including the name, website and contact channels, and mark it as verified when the review is satisfactory. Verified organizations display a verified badge on their public profile and listings.",
      },
      {
        heading: "Important profile changes",
        body: "If a verified employer changes an important identity field such as the organization name or website, the verification status returns to Pending Verification so the new information can be reviewed.",
      },
      {
        heading: "What verification means",
        body: "Verification reflects our review of organization profile information at a point in time. It is not an audit of the organization's finances, clinical standards or recruitment practices. Applicants should still review each opportunity carefully and use normal professional due diligence.",
      },
    ],
  },
  {
    slug: "safety",
    title: "Applicant Safety & Scam Prevention",
    intro:
      "Use extra caution when a recruitment request is unusual, urgent, difficult to verify, or asks for money or sensitive information.",
    updated: "17 September 2026",
    related: ["jobseekers", "organizations"],
    sections: [
      {
        heading: "Check the organization",
        body: "Review the organization profile, official website and public contact channels where available. Look for a verified badge, and be wary when the only contact route is a personal phone number or a free email address.",
      },
      {
        heading: "Be cautious with payments",
        body: "Do not pay money merely to apply for an opportunity advertised here. No genuine employer charges for considering an application. Verify any unusual financial request directly with the recruiting organization using contact details you looked up yourself — never the ones in the suspicious message.",
      },
      {
        heading: "Protect personal information",
        body: "Share only information reasonably required for the application, and avoid sending passwords, PINs, mobile-money codes or unrelated financial credentials.",
        points: [
          "Legitimate employers do not need your bank PIN or mobile-money code.",
          "Send copies of your national ID or licence only when the application genuinely requires them.",
          "Be careful with documents sent over messaging apps to unverified contacts.",
        ],
      },
      {
        heading: "Notice the pressure tactics",
        body: "Urgency, exclusivity, threats of losing the slot, and requests to move the conversation off official channels are all standard scam patterns. Slow down and verify before you act.",
      },
      {
        heading: "Report suspicious content",
        body: "Use the report button on the listing page, or the Report an Issue form in the footer, and provide the opportunity link plus a short explanation of your concern. Reports go straight to our moderation queue.",
      },
    ],
  },
];

export function getHelpGuide(slug: string): HelpGuide | undefined {
  return HELP_GUIDES.find((g) => g.slug === slug);
}
