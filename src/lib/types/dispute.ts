import { Timestamp } from "firebase/firestore";

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected';

export interface Dispute {
    id: string;
    bookingId: string;
    reporterId: string;
    targetId: string;
    reporterType: 'customer' | 'barber';
    reason: string;
    details: string;
    status: DisputeStatus;
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    resolvedBy?: string; // Admin UID
    resolutionNote?: string;
    refundAmount?: number;
    barberPayout?: number;
}

export type TrustLevel = 'green' | 'yellow' | 'red';

// Extending existing types (Conceptual representation for the Admin App)
export interface SecurityMetadata {
    strikeCount: number;
    trustLevel: TrustLevel;
    isTerminated: boolean;
    terminationReason?: string;
    lastStrikeAt?: Timestamp;
}
