"use client";

import { BarberApplication } from "@/lib/types/barber";
import { Star, AlertTriangle, ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Props {
    barber: BarberApplication;
}

export const BarberTrustCard = ({ barber }: Props) => {
    const trust = barber.trust || {
        avgRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    // Flag logic: More than 2 flags or rating < 3.5 after 5 reviews
    const isHighRisk = trust.totalReviews >= 5 && trust.avgRating < 3.5;
    const isNew = trust.totalReviews < 5;

    return (
        <div className={`group bg-card border rounded-xl p-4 transition-all hover:bg-muted/50 ${isHighRisk ? "border-danger/30" : "border-border hover:border-brand-500/50"
            }`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-foreground group-hover:text-brand-400 transition-colors">
                        {barber.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{barber.email}</p>
                </div>
                {isHighRisk && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20">
                        <AlertTriangle size={12} /> RISK
                    </div>
                )}
                {isNew && !isHighRisk && (
                    <div className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                        NEW
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {trust.totalReviews > 0 ? (
                            <>
                                <span className="text-2xl font-bold text-foreground leading-none">
                                    {trust.avgRating.toFixed(1)}
                                </span>
                                <div className="flex text-yellow-500">
                                    <Star size={16} fill="currentColor" />
                                </div>
                            </>
                        ) : (
                            <span className="text-sm font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded">
                                NEW PARTNER
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare size={12} />
                        {trust.totalReviews > 0 ? `${trust.totalReviews} reviews` : "No ratings yet"}
                    </div>
                </div>

                <Link
                    href={`/dashboard/barber/${barber.uid}`}
                    className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-white transition-colors"
                >
                    VIEW TRUST <ChevronRight size={14} />
                </Link>
            </div>

            {/* Mini sparkline or indicators for flags in future phases */}
        </div>
    );
};
