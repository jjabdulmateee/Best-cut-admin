"use client";

import React, { useState } from "react";
import { Wallet } from "@/lib/types/wallet";
import { financeService } from "@/lib/services/financeService";
import { DollarSign, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface WalletActionsProps {
    wallet: Wallet;
}

export default function WalletActions({ wallet }: WalletActionsProps) {
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    if (wallet.role !== "barber") return null;

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason) return;

        setLoading(true);
        try {
            await financeService.withdrawBarberFunds({
                barberId: wallet.userId,
                amount: parseFloat(amount),
                reason
            });
            toast.success("Withdrawal processed successfully");
            setIsWithdrawing(false);
            setAmount("");
            setReason("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Operational Actions
            </h3>

            {!isWithdrawing ? (
                <button
                    onClick={() => setIsWithdrawing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <DollarSign className="w-4 h-4" />
                    Force Withdrawal
                </button>
            ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-400 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold text-sm">Review Safety Rules</span>
                        </div>
                        <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                            <li>Check that the wallet is not frozen.</li>
                            <li>Ensure Escrow Balance is $0.00.</li>
                            <li>Reason is required for audit logs.</li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Reason
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Policy violation, manual correction..."
                            required
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsWithdrawing(false)}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Withdrawal
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
