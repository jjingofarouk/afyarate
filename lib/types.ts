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
  claimed?: boolean;
}

export interface ProfileDetails {
  phone: string | null;
  whatsapp: string | null;
  workplace: string | null;
  workAddress: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  consultationFee: string | null;
  availability: string | null;
  photoUrl: string | null;
  website: string | null;
  facebook: string | null;
  xHandle: string | null;
  tiktok: string | null;
  instagram: string | null;
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
  submitterName: string | null;
  submitterEmail: string | null;
  rejectionReason: string | null;
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
  benefits: string | null;
  requiredDocuments: string | null;
  keyDates: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  tags: string[];
  featured: boolean;
  status: "draft" | "published" | "expired" | "archived" | "rejected";
  publishedAt: string | null;
  views: number;
  imageUrl: string | null;
}

// ---------------------------------------------------------------------------
// Facilities, hospitals & pharmacies, ratable like practitioners.
// ---------------------------------------------------------------------------

export const FACILITY_KINDS = ["hospital", "pharmacy"] as const;

export type FacilityKind = (typeof FACILITY_KINDS)[number];

export const FACILITY_KIND_LABELS: Record<
  FacilityKind,
  { label: string; plural: string }
> = {
  hospital: { label: "Hospital", plural: "Hospitals" },
  pharmacy: { label: "Pharmacy", plural: "Pharmacies" },
};

export interface Facility {
  id: number;
  slug: string;
  kind: FacilityKind;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  description: string | null;
  phone: string | null;
  specialties: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  avgRating: number | null;
  ratingCount: number;
  services: string[];
  claimed?: boolean;
}

export interface FacilityProfileDetails {
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  services: string[];
  photoUrl: string | null;
  website: string | null;
  facebook: string | null;
  xHandle: string | null;
  instagram: string | null;
}

export interface FacilityRating {
  id: number;
  facilityId: number;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
  verified: boolean;
}

export interface FacilitySearchResult {
  items: Facility[];
  total: number;
  page: number;
  pageSize: number;
  kinds: FacilityKind[];
  cities: string[];
}

// ---------------------------------------------------------------------------
// MOHU merge: accounts, jobs pipeline, community, messaging, updates.
// Identity is a one-click profile handle (uuid, no passwords) until Supabase
// Auth lands; the handle is stored in localStorage (see lib/handle.ts).
// ---------------------------------------------------------------------------

export type ProfileRole = "member" | "jobseeker" | "employer" | "admin";

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: ProfileRole;
  organization: string | null;
  cadre: string | null;
  location: string | null;
  bio: string | null;
  skills: string | null;
  verified: boolean;
}

export interface Organization {
  id: number;
  slug: string;
  name: string;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  verified: boolean;
}

export interface SeekerProfile {
  profileId: string;
  seekingTitle: string | null;
  availability: string | null;
  desiredRoles: string | null;
  desiredLocations: string | null;
  employmentPreference: string | null;
  skills: string | null;
  expectedSalary: string | null;
  publicSummary: string | null;
  showEmail: boolean;
  showPhone: boolean;
  cvVisibility: "private" | "employers" | "public";
  active: boolean;
  profile?: Profile | null;
}

export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface JobApplication {
  id: number;
  postId: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  coverNote: string | null;
  cvUrl: string | null;
  status: ApplicationStatus;
  createdAt: string;
}

export type CommunityVisibility = "public" | "followers" | "following" | "network";

export interface CommunityPost {
  id: number;
  profileId: string | null;
  authorName: string;
  authorHandle: string | null;
  body: string;
  visibility: CommunityVisibility;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: number;
  postId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export type ConnectionStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "declined"
  | "cancelled";

export interface ConnectionRequest {
  id: number;
  senderName: string;
  targetType: "member" | "practitioner" | "facility" | "organization";
  targetId: number | null;
  requestType: string;
  subject: string;
  details: string;
  status: ConnectionStatus;
  createdAt: string;
}

export interface DmThread {
  id: number;
  otherProfileId: string;
  otherName: string;
  lastBody: string | null;
  unread: number;
  updatedAt: string;
}

export interface DmMessage {
  id: number;
  threadId: number;
  senderProfileId: string | null;
  senderName: string;
  body: string;
  mine: boolean;
  createdAt: string;
}

export interface HealthUpdate {
  id: number;
  authorName: string;
  title: string;
  body: string;
  sourceUrl: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  audience: string;
  read: boolean;
  createdAt: string;
}

export interface PlatformFeedback {
  id: number;
  authorName: string;
  rating: number;
  feedbackText: string;
  helpful: number;
  notHelpful: number;
  createdAt: string;
}
