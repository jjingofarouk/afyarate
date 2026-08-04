export interface Practitioner {
  id: number;
  name: string;
  council: string | null;
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
}
