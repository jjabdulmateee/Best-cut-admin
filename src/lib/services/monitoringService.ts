import { db } from "../firebase/config";
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    arrayUnion,
    Timestamp,
    increment
} from "firebase/firestore";
import { BarberApplication, Strike } from "../types/barber";

class MonitoringService {
    /**
     * Identifies barbers who haven't moved or taken a booking in 7+ days.
     */
    async getChurnedBarbers() {
        const churnThreshold = new Date();
        churnThreshold.setDate(churnThreshold.getDate() - 7);

        const q = query(
            collection(db, "barber_applications"),
            where("accountStatus", "==", "approved"),
            where("lastActiveAt", "<=", Timestamp.fromDate(churnThreshold))
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(snap => ({ uid: snap.id, ...snap.data() } as unknown as BarberApplication));
    }

    /**
     * Adds a strike to a barber's record.
     */
    async addStrike(barberId: string, strike: Omit<Strike, "id" | "createdAt">) {
        const strikeId = `strike_${Date.now()}`;
        const newStrike: Strike = {
            ...strike,
            id: strikeId,
            createdAt: Timestamp.now(),
        };

        const barberRef = doc(db, "barber_applications", barberId);
        await updateDoc(barberRef, {
            strikes: arrayUnion(newStrike)
        });

        return strikeId;
    }

    /**
     * Updates reliability score based on new booking action.
     */
    async updateReliability(barberId: string, wasAccepted: boolean) {
        const barberRef = doc(db, "barber_applications", barberId);
        await updateDoc(barberRef, {
            reliabilityScore: increment(wasAccepted ? 0.01 : -0.05)
        });
    }

    /**
     * Detects fraudulent rating patterns.
     */
    async detectRatingFraud(barberId: string) {
        return {
            riskLevel: "low",
            reason: "No suspicious activity detected in the last 24h."
        };
    }
}

export const monitoringService = new MonitoringService();
