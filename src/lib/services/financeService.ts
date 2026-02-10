import { getFunctions, httpsCallable } from "firebase/functions";
import { configService } from "./configService";
import { PlatformConfig } from "../types/platform";
import { auth } from "../firebase/config";
import { Wallet } from "../types/wallet";
import { walletService } from "./walletService";

interface RefundParams {
    bookingId: string;
    amount: number;
    reason: string;
    targetUserId: string; // Customer receiving refund
}

interface WithdrawParams {
    barberId: string;
    amount: number;
    reason: string;
}

class FinanceService {
    private config: PlatformConfig | null = null;

    constructor() {
        // Subscribe to config to always have latest limits
        configService.subscribeToConfig((cfg) => {
            this.config = cfg;
        });
    }

    /**
     * Issue a refund with strict guardrails
     * Phase 4.1.B
     */
    async issueRefund(params: RefundParams): Promise<{ success: boolean; message: string }> {
        if (!this.config) {
            throw new Error("System configuration not loaded. Action denied.");
        }

        const { amount, bookingId } = params;
        const { maxSingleRefundAmount, largeRefundThreshold } = this.config;

        // 1. Hard Limit Check
        if (amount > maxSingleRefundAmount) {
            throw new Error(`Refund amount $${amount} exceeds hard limit of $${maxSingleRefundAmount}.`);
        }

        // 2. Large Refund Threshold Check (Requires Secondary Approval)
        // Note: For this phase, we enforce this by "rejecting" single-admin attempts or requires a backend check.
        // Since we are simulating strict backend enforcement:
        if (amount > largeRefundThreshold) {
            // In a real dual-admin flow, we'd prompt for second admin credentials here.
            // For Phase 4.1 completion, we'll throw a specific error that UI can handle or just block it.
            throw new Error(`Refund of $${amount} requires secondary admin approval (Threshold: $${largeRefundThreshold}).`);
        }

        try {
            const functions = getFunctions();
            const refundFn = httpsCallable(functions, 'adminRefund');

            await refundFn({
                userId: params.targetUserId,
                amount,
                bookingId,
                reason: params.reason
            });

            // Backend handles audit logging with before/after balances
            return { success: true, message: "Refund processed successfully." };
        } catch (error: any) {
            console.error("Refund failed:", error);
            throw new Error(error.message || "Refund failed");
        }
    }

    /**
     * Withdraw funds for a barber with safety checks
     * Phase 4.1.C
     */
    async withdrawBarberFunds(params: WithdrawParams): Promise<{ success: boolean; message: string }> {
        const { barberId, amount, reason } = params;

        // 1. Fetch Wallet to check freeze status and escrow
        const wallet = await walletService.getWallet(barberId);

        if (!wallet) {
            throw new Error("Barber wallet not found.");
        }

        // Check if frozen
        if (wallet.isFrozen) {
            throw new Error("Wallet is FROZEN. Withdrawal denied.");
        }

        // Check escrow balance (Safety: Must be 0 or check constraint? "Ensure escrowBalance == 0" from prompt)
        // Prompt says: "Ensure escrowBalance == 0"
        if (wallet.escrowBalance > 0) {
            throw new Error(`Cannot withdraw: Wallet has active escrow balance of $${wallet.escrowBalance}.`);
        }

        // Check sufficient balance
        if (wallet.balance < amount) {
            throw new Error(`Insufficient funds. Available: $${wallet.balance}`);
        }

        try {
            const functions = getFunctions();
            // Using 'adminWithdraw' as the function name
            const withdrawFn = httpsCallable(functions, 'adminWithdraw');

            await withdrawFn({
                barberId,
                amount,
                reason
            });

            // Backend handles audit logging with before/after balances
            return { success: true, message: "Withdrawal processed successfully." };
        } catch (error: any) {
            console.error("Withdrawal failed:", error);
            throw new Error(error.message || "Withdrawal failed");
        }
    }
}

export const financeService = new FinanceService();
