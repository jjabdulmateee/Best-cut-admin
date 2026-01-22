import { db } from "../firebase/config";
import {
    collection,
    onSnapshot,
    query,
    where,
    Timestamp,
    getDocs,
    limit,
    orderBy
} from "firebase/firestore";
import { notificationService } from "./notificationService";
import { Booking } from "../types/booking";

class RiskService {
    /**
     * Initializes background monitoring for platform risks.
     * In a production app, this would be partially shared with Cloud Functions.
     */
    initRiskMonitoring() {
        console.log("Risk Monitoring Initialized...");
        this.monitorStuckBookings();
    }

    /**
     * Detects bookings that have been in a non-terminal state for too long.
     */
    private monitorStuckBookings() {
        const q = query(
            collection(db, "bookings"),
            where("status", "in", ["accepted", "on_the_way", "arrived"])
        );

        return onSnapshot(q, async (snap) => {
            const now = Date.now();
            const STUCK_THRESHOLD = 30 * 60 * 1000; // 30 minutes

            for (const doc of snap.docs) {
                const booking = doc.data() as Booking;
                const lastUpdated = booking.createdAt.toMillis(); // Simplification: in real life use a lastUpdatedAt

                if (now - lastUpdated > STUCK_THRESHOLD) {
                    // Check if we already have an active alert for this booking
                    const alertQuery = query(
                        collection(db, "notifications"),
                        where("entityId", "==", doc.id),
                        where("status", "==", "active"),
                        where("type", "==", "BOOKING_ISSUE")
                    );
                    const alertSnap = await getDocs(alertQuery);

                    if (alertSnap.empty) {
                        await notificationService.createAlert({
                            title: "Stuck Booking Detected",
                            message: `Booking ${doc.id.slice(0, 8)} has been in '${booking.status}' for over 30 mins.`,
                            type: "BOOKING_ISSUE",
                            severity: "WARNING",
                            entityId: doc.id,
                            entityType: "booking"
                        });
                    }
                }
            }
        });
    }

    /**
     * Basic logic for flagging high-rejection barbers.
     */
    async analyzeBarberRisk(barberId: string) {
        // Implementation for detecting high cancellation/rejection rates
        // This would typically query admin_logs or a dedicated stats collection
    }
}

export const riskService = new RiskService();
