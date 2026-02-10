export type BarberStatus = "draft" | "pending" | "approved" | "rejected" | "disabled";
export type ServiceStatus = "pending" | "approved" | "rejected";

export type Strike = {
  id: string;
  reason: string;
  severity: "low" | "medium" | "high";
  createdAt: any; // Timestamp
  adminId: string;
};

export type BarberDocumentUrls = {
  profilePicture?: string;
  idDocument?: string; // Legacy support
  idCard?: string[]; // Front/Back
  shopPhotos?: string[];
  certificates?: string[];
  otherDocuments?: string[];
};

export type Pricing = {
  haircut: number;
  beard: number;
  facial?: number;
  [key: string]: number | undefined;
};

import { BarberTrust } from "./trust";

export type ShopLocation = {
  lat: number;
  lng: number;
  address: string;
};

export type BarberApplication = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;

  // Global Account State
  accountStatus: BarberStatus;
  status?: BarberStatus; // Legacy alias

  // Service-Level Permissions
  shopService: ServiceStatus;
  doorstepService: ServiceStatus;

  // Metadata
  shopName?: string;
  shopLocation?: ShopLocation;
  doorstepRadius?: number; // km
  pricing?: Pricing;

  // Rejection/Reasoning
  rejectionReason?: string;
  disabledReason?: string;

  // Auditing
  submittedAt?: string | number | { toDate: () => Date };
  approvedAt?: string | number | { toDate: () => Date };
  approvedBy?: string;
  rejectedAt?: string | number | { toDate: () => Date };
  rejectedBy?: string;
  disabledAt?: string | number | { toDate: () => Date };
  disabledBy?: string;

  // Documents
  documents?: BarberDocumentUrls;

  // Trust System Data
  trust?: BarberTrust;

  // Phase E: Map & Visibility
  mapVisibility: boolean;
  lastLocationUpdate?: any; // Timestamp
  shopLocationVerified: boolean;
  doorstepRadiusLocked: boolean;
  geoZoneId?: string;

  // Phase G/3: Monitoring & Enforcement
  lastActiveAt?: any; // Timestamp
  reliabilityScore?: number; // 0-1 percentage
  strikes?: Strike[];
  strikeCount: number;
  trustLevel: "green" | "yellow" | "red";
  isBanned?: boolean;
  isTerminated: boolean;
  terminationReason?: string;
};
