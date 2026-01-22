"use client";

import { useState } from "react";
import { Review, FlagReason, ReviewVisibility } from "@/lib/types/trust";
import { trustService } from "@/lib/services/trustService";
import { Star, Flag, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface Props {
    review: Review;
    onUpdate?: () => void;
}

export const ReviewItem = ({ review, onUpdate }: Props) => {
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showFlagMenu, setShowFlagMenu] = useState(false);

    const handleToggleVisibility = async () => {
        setIsActionLoading(true);
        try {
            const nextVisibility: ReviewVisibility = review.visibility === "VISIBLE" ? "HIDDEN" : "VISIBLE";
            await trustService.updateReviewVisibility(review.id, nextVisibility);
            toast.success(`Review is now ${nextVisibility.toLowerCase()}`);
            onUpdate?.();
        } catch (error) {
            toast.error("Failed to update visibility");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleFlag = async (reason: FlagReason) => {
        setIsActionLoading(true);
        try {
            await trustService.flagReview(review.id, reason);
            toast.success("Review flagged successfully");
            setShowFlagMenu(false);
            onUpdate?.();
        } catch (error) {
            toast.error("Failed to flag review");
        } finally {
            setIsActionLoading(false);
        }
    };

    const flagReasons: { value: FlagReason; label: string }[] = [
        { value: "FAKE_REVIEW", label: "Fake Review" },
        { value: "HARASSMENT", label: "Harassment" },
        { value: "SPAM", label: "Spam" },
        { value: "HATE_SPEECH", label: "Hate Speech" },
        { value: "IRRELEVANT", label: "Irrelevant" },
    ];

    return (
        <div className={`p-4 rounded-xl border transition-all ${review.visibility === "HIDDEN"
            ? "bg-muted border-border opacity-60"
            : "bg-card border-border hover:border-brand-500/50"
            }`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex text-yellow-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={14}
                                    fill={s <= review.rating ? "currentColor" : "none"}
                                    className={s <= review.rating ? "text-yellow-500" : "text-muted-foreground/30"}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {review.serviceType}
                        </span>
                        {review.isFlagged && (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20">
                                <AlertTriangle size={10} /> Flagged: {review.flagReason}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Booking: <span className="text-foreground/70 font-mono">{review.bookingId}</span> •
                        {format(review.createdAt.toDate(), "MMM dd, yyyy")}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleVisibility}
                        disabled={isActionLoading}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        title={review.visibility === "VISIBLE" ? "Hide Review" : "Show Review"}
                    >
                        {review.visibility === "VISIBLE" ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowFlagMenu(!showFlagMenu)}
                            disabled={isActionLoading}
                            className={`p-2 rounded-lg transition-colors ${showFlagMenu ? "bg-danger text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                        >
                            <Flag size={16} />
                        </button>

                        {showFlagMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                                    Select Flag Reason
                                </div>
                                {flagReasons.map((reason) => (
                                    <button
                                        key={reason.value}
                                        onClick={() => handleFlag(reason.value)}
                                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-danger hover:text-white transition-colors"
                                    >
                                        {reason.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-foreground/80 text-sm italic">
                {review.reviewText ? `"${review.reviewText}"` : "No comment provided."}
            </p>
        </div>
    );
};
