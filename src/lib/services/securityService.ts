import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";

class SecurityService {
    /**
     * Apply a formal strike to a user or barber
     */
    async applyStrike(params: {
        targetId: string;
        targetType: 'customer' | 'barber';
        reason: string;
        severity: 'low' | 'medium' | 'high';
    }) {
        const applyStrikeFn = httpsCallable(functions, 'applyStrike');
        return applyStrikeFn(params);
    }

    /**
     * Issue a financial penalty/deduction
     */
    async issuePenalty(params: {
        targetId: string;
        amount: number;
        reason: string;
    }) {
        const issuePenaltyFn = httpsCallable(functions, 'issuePenalty');
        return issuePenaltyFn(params);
    }

    /**
     * Resolve an official dispute
     */
    async resolveDispute(params: {
        disputeId: string;
        resolution: string;
        refundAmount: number;
        barberPayout: number;
    }) {
        const resolveDisputeFn = httpsCallable(functions, 'resolveDispute');
        return resolveDisputeFn(params);
    }
}

export const securityService = new SecurityService();
