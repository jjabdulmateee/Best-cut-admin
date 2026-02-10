"use client";

import React, { useState, useEffect } from "react";
import { Wallet, WalletFilter, WalletSort, WalletStats } from "@/lib/types/wallet";
import { walletService } from "@/lib/services/walletService";
import SafetyIndicators from "./SafetyIndicators";
import { Search, Filter, ArrowUpDown, DollarSign, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function WalletList() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<WalletFilter>({ role: "all" });
    const [sort, setSort] = useState<WalletSort>({ field: "updatedAt", direction: "desc" });

    useEffect(() => {
        const unsubscribe = walletService.subscribeToWallets(
            async (fetchedWallets) => {
                setWallets(fetchedWallets);
                const calculatedStats = await walletService.calculateStats(fetchedWallets);
                setStats(calculatedStats);
                setLoading(false);
            },
            filter,
            sort
        );

        return () => unsubscribe();
    }, [filter, sort]);

    const filteredWallets = wallets.filter((wallet) =>
        wallet.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp.toMillis()).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading wallets...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Wallets</p>
                                <p className="text-2xl font-bold">{stats.totalWallets}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
                                <p className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Escrow</p>
                                <p className="text-2xl font-bold">{formatCurrency(stats.totalEscrow)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Flagged Wallets</p>
                                <p className="text-2xl font-bold">{stats.flaggedWallets}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by User ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <select
                        value={filter.role || "all"}
                        onChange={(e) => setFilter({ ...filter, role: e.target.value as any })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="customer">Customers</option>
                        <option value="barber">Barbers</option>
                    </select>
                    <select
                        value={filter.hasEscrow ? "yes" : "no"}
                        onChange={(e) => setFilter({ ...filter, hasEscrow: e.target.value === "yes" })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="no">All Escrow</option>
                        <option value="yes">Has Escrow</option>
                    </select>
                    <select
                        value={filter.hasFlags ? "yes" : "no"}
                        onChange={(e) => setFilter({ ...filter, hasFlags: e.target.value === "yes" })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="no">All Flags</option>
                        <option value="yes">Flagged Only</option>
                    </select>
                </div>
            </div>

            {/* Wallet Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    User ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Balance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Escrow
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Last Updated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Flags
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredWallets.map((wallet) => (
                                <tr key={wallet.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {wallet.userId.substring(0, 12)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <span className={`px-2 py-1 rounded-full text-xs ${wallet.role === "barber"
                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                            }`}>
                                            {wallet.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(wallet.balance)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(wallet.escrowBalance)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {formatDate(wallet.updatedAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {wallet.flags && <SafetyIndicators flags={wallet.flags} compact />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Link
                                            href={`/dashboard/wallets/${wallet.userId}`}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredWallets.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No wallets found
                    </div>
                )}
            </div>
        </div>
    );
}
