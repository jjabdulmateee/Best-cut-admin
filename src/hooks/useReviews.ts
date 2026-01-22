import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { Review } from "../lib/types/trust";

export const useReviews = (barberId?: string) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!barberId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "reviews"),
            where("barberId", "==", barberId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Review[];
                setReviews(list);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching reviews:", err);
                setError("Failed to load reviews");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [barberId]);

    return { reviews, loading, error };
};
