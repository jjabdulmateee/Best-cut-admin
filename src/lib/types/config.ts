import { Timestamp } from "firebase/firestore";

export interface SystemConfig {
    onboardingEnabled: boolean;       // Global switch for new barber signup
    doorstepPlatformWide: boolean;    // Global switch for doorstep service
    maxDoorstepRadius: number;        // Max allowed radius in meters

    // Phase 4.1 - Money Safety
    maxSingleRefundAmount: number;    // Hard limit for refunds
    largeRefundThreshold: number;     // Threshold requiring 2nd admin

    emergencyFreeze: boolean;         // Read-only mode for platform
    updatedAt: Timestamp;
    updatedBy: string;                // Admin ID who last changed config
}
