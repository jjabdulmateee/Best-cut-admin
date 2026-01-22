"use client";

import { BarberTrust } from "@/lib/types/trust";
import { Star } from "lucide-react";

interface Props {
    trust: BarberTrust;
}

export const RatingBreakdownView = ({ trust }: Props) => {
    const { avgRating, totalReviews, ratingBreakdown } = trust;

    // Find the max value in breakdown to scale the bars
    const maxCount = Math.max(...Object.values(ratingBreakdown));

    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-6 mb-8">
                <div className="text-center">
                    <div className="text-5xl font-bold text-foreground mb-1">
                        {totalReviews > 0 ? avgRating.toFixed(1) : "NEW"}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                        {totalReviews > 0 ? [1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={18}
                                fill={star <= Math.round(avgRating) ? "currentColor" : "none"}
                                className={star <= Math.round(avgRating) ? "text-yellow-500" : "text-muted-foreground/30"}
                            />
                        )) : (
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded">
                                No Ratings Yet
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-400">
                        {totalReviews > 0 ? `${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}` : "Service required for rating"}
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingBreakdown[rating as keyof typeof ratingBreakdown] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                        return (
                            <div key={rating} className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground w-3">{rating}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {totalReviews === 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-400">
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <strong>Uber-Grade Integriy:</strong> This barber is currently in the onboarding/new phase. Ratings will activate automatically once real customers complete their first bookings.
                    </p>
                </div>
            )}

            {totalReviews < 5 && totalReviews > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-400">
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        "New Barber" - Full rating profile will appear after 5 reviews.
                    </p>
                </div>
            )}
        </div>
    );
};
