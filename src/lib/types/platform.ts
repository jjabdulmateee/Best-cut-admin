export interface PlatformConfig {
    platformFeePercent: number;
    refundPresets: number[];
    allowCustomRefundPercentage?: boolean;
    updatedAt?: any;
    updatedBy?: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
    platformFeePercent: 10,
    refundPresets: [100, 90, 80, 50, 0],
    allowCustomRefundPercentage: false
};
