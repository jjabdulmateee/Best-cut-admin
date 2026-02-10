"use client";

import React from "react";
import { useParams } from "next/navigation";
import WalletDetail from "@/components/Wallet/WalletDetail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WalletDetailPage() {
    const params = useParams();
    const userId = params.userId as string;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/wallets"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Wallets
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet Details</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">User ID: {userId}</p>
            </div>

            <WalletDetail userId={userId} />
        </div>
    );
}
