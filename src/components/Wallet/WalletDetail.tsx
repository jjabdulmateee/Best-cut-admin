"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Transaction } from "@/lib/types/wallet";
import { walletService } from "@/lib/services/walletService";
import SafetyIndicators from "./SafetyIndicators";
import WalletActions from "./WalletActions";
import { ArrowDownCircle, ArrowUpCircle, Clock, User } from "lucide-react";

interface WalletDetailProps {
    userId: string;
}

export default function WalletDetail({ userId }: WalletDetailProps) {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [lifetimeStats, setLifetimeStats] = useState({ inflow: 0, outflow: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWallet = async () => {
            const fetchedWallet = await walletService.getWallet(userId);
            setWallet(fetchedWallet);

            if (fetchedWallet) {
                const stats = await walletService.calculateLifetimeStats(userId);
                setLifetimeStats(stats);
            }

            setLoading(false);
        };

        loadWallet();

        const unsubscribe = walletService.subscribeToTransactions(userId, (txs) => {
            setTransactions(txs);
        });

        return () => unsubscribe();
    }, [userId]);

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp.toMillis()).toLocaleString();
    };

    const getTransactionIcon = (type: string) => {
        if (type.includes("refund") || type === "deposit") {
            return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
        }
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading wallet details...</div>
            </div>
        );
    }

    if (!wallet) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Wallet not found</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
                        <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(wallet.balance)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Escrow Balance</h3>
                        <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(wallet.escrowBalance)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {wallet.role}
                    </p>
                    {wallet.isFrozen && (
                        <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
                            Frozen
                        </span>
                    )}
                </div>
            </div>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lifetime Inflow</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(lifetimeStats.inflow)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lifetime Outflow</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(lifetimeStats.outflow)}
                    </p>
                </div>
            </div>

            {/* Safety Flags */}
            {wallet.flags && wallet.flags.severity !== "none" && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Safety Alerts</h3>
                    <SafetyIndicators flags={wallet.flags} />
                </div>
            )}

            {/* Operational Actions */}
            <WalletActions wallet={wallet} />

            {/* Transaction History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Processed By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Booking ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getTransactionIcon(tx.type)}
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {tx.type.replace(/_/g, " ").toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${tx.amount >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}>
                                        {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${tx.status === "completed"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : tx.status === "failed"
                                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {formatDate(tx.timestamp)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {tx.processedBy ? tx.processedBy.substring(0, 8) + "..." : "SYSTEM"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {tx.bookingId ? tx.bookingId.substring(0, 8) + "..." : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {transactions.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No transactions found
                    </div>
                )}
            </div>
        </div>
    );
}
