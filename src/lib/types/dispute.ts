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

    // Escrow validation fields (Phase 1 - Money Safety)
    refundPercentage?: number;    // Admin's selected percentage (100, 90, 80, 50, 0)
    refundAmount?: number;         // Backend-calculated refund to customer
    barberPayout?: number;         // Backend-calculated payout to barber
    platformFee?: number;          // Backend-calculated platform fee
    escrowedAmount?: number;       // Booking totalPrice at resolution time
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
