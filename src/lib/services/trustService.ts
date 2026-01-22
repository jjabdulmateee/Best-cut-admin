import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Review, ReviewVisibility, FlagReason, BarberTrust } from "../types/trust";
import { adminService } from "./adminService";

class TrustService {
    /**
     * Creates a review and updates the barber's trust metrics transactionally.
     * Note: Security rules enforce that the booking belongs to the customer and is completed.
     */
    async createReview(data: Omit<Review, "id" | "createdAt" | "isFlagged" | "visibility">): Promise<string> {
        const reviewId = data.bookingId; // Use bookingId as reviewId to enforce 1 per booking
        const reviewRef = doc(db, "reviews", reviewId);
        const barberRef = doc(db, "barber_applications", data.barberId);

        await runTransaction(db, async (transaction) => {
            const barberSnap = await transaction.get(barberRef);
            if (!barberSnap.exists()) throw new Error("Barber not found");

            const barberData = barberSnap.data();
            const currentTrust: BarberTrust = barberData.trust || {
                avgRating: 0,
                totalReviews: 0,
                ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };

            // Calculate new averages
            const newTotalReviews = currentTrust.totalReviews + 1;
            const newBreakdown = { ...currentTrust.ratingBreakdown };
            const rating = Math.round(data.rating) as keyof typeof newBreakdown;
            newBreakdown[rating] = (newBreakdown[rating] || 0) + 1;

            // Calculate new average: (sum of all ratings) / total
            let totalPoints = 0;
            for (let r = 1; r <= 5; r++) {
                totalPoints += (newBreakdown[r as keyof typeof newBreakdown] || 0) * r;
            }
            const newAvgRating = totalPoints / newTotalReviews;

            // Write review
            transaction.set(reviewRef, {
                ...data,
                createdAt: serverTimestamp(),
                isFlagged: false,
                visibility: "VISIBLE",
            });

            // Update barber trust
            transaction.update(barberRef, {
                trust: {
                    avgRating: newAvgRating,
                    totalReviews: newTotalReviews,
                    ratingBreakdown: newBreakdown,
                }
            });
        });

        await adminService.logAction("REVIEW_CREATED", data.barberId, {
            bookingId: data.bookingId,
            rating: data.rating
        });

        return reviewId;
    }

    async flagReview(reviewId: string, reason: FlagReason): Promise<void> {
        const reviewRef = doc(db, "reviews", reviewId);
        const reviewSnap = await getDoc(reviewRef);
        if (!reviewSnap.exists()) throw new Error("Review not found");

        const reviewData = reviewSnap.data() as Review;

        await adminService.logAction("REVIEW_FLAGGED", reviewData.barberId, {
            reviewId,
            reason
        });

        await updateDoc(reviewRef, {
            isFlagged: true,
            flagReason: reason,
        });
    }

    async updateReviewVisibility(reviewId: string, visibility: ReviewVisibility): Promise<void> {
        const reviewRef = doc(db, "reviews", reviewId);
        const reviewSnap = await getDoc(reviewRef);
        if (!reviewSnap.exists()) throw new Error("Review not found");

        const reviewData = reviewSnap.data() as Review;

        await adminService.logAction(
            visibility === "HIDDEN" ? "REVIEW_HIDDEN" : "REVIEW_VISIBLE",
            reviewData.barberId,
            { reviewId }
        );

        await updateDoc(reviewRef, { visibility });
    }
}

export const trustService = new TrustService();
