import { Timestamp } from "firebase/firestore";

export type ReviewVisibility = "VISIBLE" | "HIDDEN";

export type FlagReason =
    | "FAKE_REVIEW"
    | "HARASSMENT"
    | "SPAM"
    | "HATE_SPEECH"
    | "IRRELEVANT";

export interface Review {
    id: string;
    rating: number; // 1-5
    reviewText?: string;
    bookingId: string;
    barberId: string;
    customerId: string;
    serviceType: "SHOP" | "DOORSTEP";
    createdAt: Timestamp;
    isFlagged: boolean;
    flagReason?: FlagReason;
    visibility: ReviewVisibility;
}

export interface RatingBreakdown {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
}

export interface BarberTrust {
    avgRating: number;
    totalReviews: number;
    ratingBreakdown: RatingBreakdown;
}
