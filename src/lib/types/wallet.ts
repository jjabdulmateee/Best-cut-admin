import { Timestamp } from "firebase/firestore";

/**
 * Wallet document structure
 */
export interface Wallet {
    userId: string;
    balance: number;
    escrowBalance: number;
    role: "customer" | "barber";
    isFrozen?: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Calculated fields (not in Firestore)
    flags?: WalletFlags;
    lifetimeInflow?: number;
    lifetimeOutflow?: number;
}

/**
 * Safety flags for wallet issues
 */
export interface WalletFlags {
    negativeBalance: boolean;
    negativeEscrow: boolean;
    escrowLockedTooLong: boolean;
    frozen: boolean;
    severity: "none" | "warning" | "critical";
}

/**
 * Transaction types
 */
export type TransactionType =
    | "escrow_hold"
    | "escrow_refund"
    | "payment"
    | "platform_fee"
    | "refund"
    | "penalty"
    | "withdrawal"
    | "deposit";

/**
 * Transaction document structure
 */
export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    status: "pending" | "completed" | "failed";
    timestamp: Timestamp;

    // Optional context
    bookingId?: string;
    disputeId?: string;
    reason?: string;
    processedBy?: string; // adminId or "SYSTEM"

    // Audit trail (Phase 4.1.D)
    beforeBalance?: number;
    afterBalance?: number;
    beforeEscrow?: number;
    afterEscrow?: number;
}

/**
 * Wallet filter options
 */
export interface WalletFilter {
    role?: "customer" | "barber" | "all";
    minBalance?: number;
    maxBalance?: number;
    hasEscrow?: boolean;
    isFrozen?: boolean;
    hasFlags?: boolean;
}

/**
 * Wallet sort options
 */
export type WalletSortField = "balance" | "escrowBalance" | "updatedAt" | "userId";
export type WalletSortDirection = "asc" | "desc";

export interface WalletSort {
    field: WalletSortField;
    direction: WalletSortDirection;
}

/**
 * Wallet statistics
 */
export interface WalletStats {
    totalWallets: number;
    totalBalance: number;
    totalEscrow: number;
    flaggedWallets: number;
    frozenWallets: number;
    customerWallets: number;
    barberWallets: number;
}
