"use client";

import React from "react";
import { WalletFlags } from "@/lib/types/wallet";
import { AlertTriangle, Lock, Clock, XCircle } from "lucide-react";

interface SafetyIndicatorsProps {
    flags: WalletFlags;
    compact?: boolean;
}

export default function SafetyIndicators({ flags, compact = false }: SafetyIndicatorsProps) {
    if (flags.severity === "none") {
        return compact ? null : (
            <div className="text-sm text-green-600 dark:text-green-400">
                ✓ No issues
            </div>
        );
    }

    const indicators = [];

    if (flags.negativeBalance) {
        indicators.push({
            icon: <XCircle className="w-4 h-4" />,
            label: "Negative Balance",
            severity: "critical" as const
        });
    }

    if (flags.negativeEscrow) {
        indicators.push({
            icon: <XCircle className="w-4 h-4" />,
            label: "Negative Escrow",
            severity: "critical" as const
        });
    }

    if (flags.frozen) {
        indicators.push({
            icon: <Lock className="w-4 h-4" />,
            label: "Frozen",
            severity: "warning" as const
        });
    }

    if (flags.escrowLockedTooLong) {
        indicators.push({
            icon: <Clock className="w-4 h-4" />,
            label: "Escrow Locked >24h",
            severity: "warning" as const
        });
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {indicators.map((indicator, i) => (
                    <div
                        key={i}
                        className={`p-1 rounded ${indicator.severity === "critical"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                        title={indicator.label}
                    >
                        {indicator.icon}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {indicators.map((indicator, i) => (
                <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${indicator.severity === "critical"
                            ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}
                >
                    {indicator.icon}
                    <span className="text-sm font-medium">{indicator.label}</span>
                </div>
            ))}
        </div>
    );
}
