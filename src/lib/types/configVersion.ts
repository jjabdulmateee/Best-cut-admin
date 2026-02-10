import { Timestamp } from "firebase/firestore";

/**
 * Phase 4.2 — Config Version Types
 */

export interface PlatformConfig {
    platformFeePercent: number;
    refundPresets: number[];
    allowCustomRefundPercentage: boolean;
    maxSingleRefundAmount: number;
    largeRefundThreshold: number;
    emergencyFreeze: boolean;
    updatedAt: Timestamp;
    updatedBy: string;
}

export interface ConfigVersion {
    versionId: string;
    createdAt: Timestamp;
    createdByAdminId: string;
    createdByAdminEmail: string;
    changeReason: string;
    configSnapshot: PlatformConfig;
    previousVersionId: string | null;
    isRollback: boolean;
    rollbackFromVersionId?: string;
}

export interface FieldDiff {
    field: string;
    oldValue: any;
    newValue: any;
    changeType: "added" | "removed" | "modified";
}
