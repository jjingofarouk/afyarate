export interface Practitioner {
  id: number;
  name: string;
  council: string | null;
  profession: string | null;
  registrationStatus: string | null;
  registrationNo: string | null;
  registrationDate: string | null;
  licenseNumber: string | null;
  licenseExpiryDate: string | null;
  licenceStatus: string | null;
  qualifications: string | null;
  imageUrl: string | null;
  recordCount: number;
  avgRating: number | null;
  ratingCount: number;
}

export interface LicenseRecord {
  id: number;
  practitionerId: number;
  name: string | null;
  council: string | null;
  registrationNo: string | null;
  registrationDate: string | null;
  licenseNumber: string | null;
  licenseExpiryDate: string | null;
  licenceStatus: string | null;
  qualifications: string | null;
  imageUrl: string | null;
}

export interface Rating {
  id: number;
  practitionerId: number;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
  verified: boolean;
}

export interface SearchResult {
  items: Practitioner[];
  total: number;
  page: number;
  pageSize: number;
  councils: string[];
  professions: string[];
}

export const POST_TYPES = [
  "job",
  "internship",
  "scholarship",
  "grant",
  "fellowship",
  "conference",
  "opportunity",
  "other",
] as const;

export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<PostType, { label: string; plural: string }> = {
  job: { label: "Job", plural: "Jobs" },
  internship: { label: "Internship", plural: "Internships" },
  scholarship: { label: "Scholarship", plural: "Scholarships" },
  grant: { label: "Grant", plural: "Grants" },
  fellowship: { label: "Fellowship", plural: "Fellowships" },
  conference: { label: "Conference", plural: "Conferences" },
  opportunity: { label: "Opportunity", plural: "Opportunities" },
  other: { label: "Other", plural: "Other" },
};

export interface Post {
  id: number;
  slug: string;
  type: PostType;
  title: string;
  organization: string;
  category: string | null;
  profession: string | null;
  location: string | null;
  country: string;
  employmentType: string | null;
  experienceLevel: string | null;
  qualification: string | null;
  eligibility: string | null;
  salary: string | null;
  description: string;
  summary: string | null;
  howToApply: string | null;
  applicationUrl: string | null;
  applicationEmail: string | null;
  deadline: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  tags: string[];
  featured: boolean;
  status: "draft" | "published" | "expired" | "archived";
  publishedAt: string | null;
  views: number;
  imageUrl: string | null;
}
