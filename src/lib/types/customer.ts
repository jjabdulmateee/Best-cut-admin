import { Timestamp } from "firebase/firestore";

export interface Customer {
    uid: string;
    email: string | null;
    phoneNumber: string | null;
    displayName: string | null;
    photoURL: string | null;
    status: 'active' | 'suspended' | 'banned' | 'flagged';
    riskScore: number; // 0-100
    strikes: number;
    createdAt: Timestamp;
    lastActive?: Timestamp;
    // Governance Metadata
    suspensionEndsAt?: Timestamp;
    bannedAt?: Timestamp;
    bannedBy?: string;
    bannedReason?: string;
    metadata?: {
        lastAdminAction?: string;
        lastAdminActionAt?: Timestamp;
        notes?: string;
    };
}
