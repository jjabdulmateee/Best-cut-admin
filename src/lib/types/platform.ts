export interface PlatformConfig {
    platformFeePercent: number;
    refundPresets: number[];
    allowCustomRefundPercentage?: boolean;

    // Phase 4.1.B - Refund Guardrails
    maxSingleRefundAmount: number;      // Hard limit (e.g., $1000)
    largeRefundThreshold: number;       // Requires dual admin approval (e.g., $700)

    emergencyFreeze?: boolean;
    updatedAt?: any;
    updatedBy?: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
    platformFeePercent: 10,
    refundPresets: [100, 90, 80, 50, 0],
    allowCustomRefundPercentage: false,
    maxSingleRefundAmount: 1000,
    largeRefundThreshold: 700,
    emergencyFreeze: false
};
