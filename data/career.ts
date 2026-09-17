export interface CareerSection {
  heading: string;
  body: string;
  points?: string[];
}

export interface CareerGuide {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: CareerSection[];
}

// Practical career guidance for Ugandan health workers. Mirrors the legacy
// career/* pages, expanded where the original was a single card of text.
export const CAREER_GUIDES: CareerGuide[] = [
  {
    slug: "cv-cover-letters",
    title: "CV & Cover Letters",
    summary:
      "Build focused applications that show your clinical, technical and professional value.",
    updated: "17 September 2026",
    sections: [
      {
        heading: "Lead with what the role needs",
        body: "A hiring panel reads your CV against the advert, not in the abstract. Pull the required cadre, registration, years of experience and any special skills straight out of the listing and make sure each one is visible within the first half page.",
        points: [
          "Match the job title wording where it is honest to do so.",
          "Put registration and licence status near the top — it is the first thing clinical employers check.",
          "Name your current or most recent facility and your role there.",
        ],
      },
      {
        heading: "Keep it skimmable",
        body: "Two to three pages is plenty for most clinical roles. Use short bullet points, plain headings and consistent dates (month and year). Recruiters screening dozens of applications will not read paragraphs.",
        points: [
          "Bullets, not paragraphs, for duties and achievements.",
          "Quantify where you can: patient load, team size, theatre lists, outreach numbers.",
          "Reverse chronological order, no unexplained gaps left ambiguous.",
        ],
      },
      {
        heading: "Cover letters that earn the interview",
        body: "Three short paragraphs: why this organization, why you specifically, and what you would do in the first few months. Address it to a person if the advert names one. If the listing asks you to apply through a form or email with a subject line, follow that instruction exactly.",
        points: [
          "Never send the same letter to two employers — the name always shows.",
          "If you are changing cadre or returning to practice, explain the transition in one sentence and move on.",
          "Close with your availability and how to reach you.",
        ],
      },
      {
        heading: "Format and file hygiene",
        body: "Send PDF unless the advert asks for Word. Name files clearly — Firstname-Lastname-CV.pdf beats cv-final-2.pdf. If a document is requested in a particular format or naming convention, that is a test of whether you read instructions.",
      },
    ],
  },
  {
    slug: "interviews",
    title: "Interview Preparation",
    summary: "Prepare examples, documents and questions before healthcare interviews.",
    updated: "17 September 2026",
    sections: [
      {
        heading: "Expect competency questions",
        body: "Clinical and public-health employers increasingly ask for real examples rather than opinions. Prepare six to eight stories from your own practice and rehearse them out loud.",
        points: [
          "A clinical judgement call you made under pressure.",
          "A time you handled a complication, an error or a near miss.",
          "A conflict with a colleague or a patient's family, and how it resolved.",
          "Something you improved in a ward, clinic, pharmacy or programme.",
        ],
      },
      {
        heading: "Use a consistent structure",
        body: "For each story: the situation, what you did, the outcome, and what you would do differently. Keep it under two minutes. Interviewers remember structure far more than detail.",
      },
      {
        heading: "Bring the paperwork",
        body: "Carry originals and copies of your licence or registration certificate, academic transcripts, a national ID or passport, and any certificates the advert asked for. Bring your referee contacts on a single sheet.",
      },
      {
        heading: "Ask good questions",
        body: "Ask about supervision and mentorship, the on-call or shift pattern, how the team measures quality, and what happened to the last person in the role. These signal seriousness and help you decide whether you want the job.",
      },
      {
        heading: "Virtual interviews",
        body: "Test your camera, microphone and connection beforehand. Sit against a plain wall, look at the lens rather than your own thumbnail, and keep the documents you may need within reach.",
      },
    ],
  },
  {
    slug: "applications",
    title: "Job Application Strategy",
    summary: "Improve application quality instead of sending the same application everywhere.",
    updated: "17 September 2026",
    sections: [
      {
        heading: "Check eligibility first",
        body: "Confirm cadre, registration, required experience, location and the deadline before you invest an evening in an application. Being screened out on a hard requirement is avoidable.",
      },
      {
        heading: "Follow the instructions",
        body: "Use the required application channel and naming format. Attach only the documents requested unless the employer says otherwise — extra attachments are not a bonus if the instructions said otherwise.",
        points: [
          "If the advert says apply on the platform, use the platform so the employer sees a complete record.",
          "If it says email, use the exact subject line they specified.",
          "If it says a website portal, register early — portals get slow on the deadline day.",
        ],
      },
      {
        heading: "Apply in batches, not all at once",
        body: "Quality beats volume. Ten well-targeted applications will beat a hundred generic ones. Group your applications by sector (government, NGO, private hospital, pharmacy chain) so you can tailor the language once per group.",
      },
      {
        heading: "Track applications",
        body: "Record the role, organization, deadline, date submitted, reference number and follow-up status. Our My Applications page tracks anything you applied for on-platform, and the same discipline works for external ones.",
      },
      {
        heading: "Avoid scams",
        body: "Be cautious with unexpected payment requests, unofficial contacts and unverifiable organizations. No genuine employer asks for money to consider an application. Read our applicant safety guide and report anything suspicious.",
      },
    ],
  },
  {
    slug: "career-planning",
    title: "Career Planning",
    summary: "Turn opportunities into a longer-term professional development plan.",
    updated: "17 September 2026",
    sections: [
      {
        heading: "Choose a direction",
        body: "Identify the clinical, public-health, research, management or academic path you want to strengthen. You do not have to commit forever, but a direction makes the next decision easier.",
      },
      {
        heading: "Map skill gaps",
        body: "Compare your target roles with your current competencies, registration, experience and qualifications. Write the gap list down — it usually turns into a short set of concrete next steps.",
        points: [
          "Which competencies appear in almost every advert for your target role?",
          "What does your professional council require for the next level of registration?",
          "Which short course or certificate is most often named as an advantage?",
        ],
      },
      {
        heading: "Build evidence",
        body: "Prioritize supervised experience, relevant short courses, projects, teaching, research and leadership work that supports your target path. A certificate nobody asked for is worth less than six months of documented experience in the area you want to move into.",
      },
      {
        heading: "Use the market, carefully",
        body: "Our Market Insights page shows which cadres, locations and employers are hiring, and how competitive listings are. Treat it as a platform signal for where to aim your next move, not as an official national labour-market estimate.",
      },
      {
        heading: "Review periodically",
        body: "Reassess your goals every six to twelve months as your experience grows and the opportunity market shifts. Keep your profile, CV and credential list updated so you can move quickly when the right advert appears.",
      },
    ],
  },
];

export function getCareerGuide(slug: string): CareerGuide | undefined {
  return CAREER_GUIDES.find((g) => g.slug === slug);
}
