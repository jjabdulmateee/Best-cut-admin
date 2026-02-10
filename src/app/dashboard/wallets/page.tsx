"use client";

import React from "react";
import WalletList from "@/components/Wallet/WalletList";
import { Wallet } from "lucide-react";
import Link from "next/link";

export default function WalletsPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Wallet className="w-8 h-8" />
                        Wallet Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Monitor all wallets, balances, and escrow with safety indicators
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center bg-card border border-border p-1 rounded-xl">
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Overview</Link>
                        <Link href="/dashboard/fleet" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Fleet</Link>
                        <Link href="/dashboard/map" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Map HQ</Link>
                        <Link href="/dashboard/ops" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Ops Center</Link>
                        <Link href="/dashboard/wallets" className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors text-foreground bg-muted rounded-lg shadow-sm">Wallets</Link>
                        <Link href="/dashboard/trust" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Trust HQ</Link>
                        <Link href="/dashboard/disputes" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Litigation</Link>
                        <Link href="/dashboard/analytics" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
                    </nav>
                </div>
            </div>

            <WalletList />
        </div>
    );
}
