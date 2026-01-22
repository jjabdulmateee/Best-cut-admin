import { Timestamp } from "firebase/firestore";

export interface SystemConfig {
    onboardingEnabled: boolean;       // Global switch for new barber signup
    doorstepPlatformWide: boolean;    // Global switch for doorstep service
    maxDoorstepRadius: number;        // Max allowed radius in meters
    emergencyFreeze: boolean;         // Read-only mode for platform
    updatedAt: Timestamp;
    updatedBy: string;                // Admin ID who last changed config
}
