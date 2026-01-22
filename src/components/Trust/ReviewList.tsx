"use client";

import { useReviews } from "@/hooks/useReviews";
import { ReviewItem } from "./ReviewItem";
import { LoadingSpinner } from "../LoadingSpinner";
import { MessageSquareOff } from "lucide-react";

interface Props {
    barberId: string;
}

export const ReviewList = ({ barberId }: Props) => {
    const { reviews, loading, error } = useReviews(barberId);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner />
                <p className="text-muted-foreground text-sm">Loading reviews...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-danger/10 text-danger p-4 rounded-xl border border-danger/20 text-center">
                {error}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3 border-2 border-dashed border-border rounded-xl">
                <MessageSquareOff size={32} />
                <p className="text-sm font-medium">No reviews yet for this barber.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Reviews ({reviews.length})
                </h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
};
