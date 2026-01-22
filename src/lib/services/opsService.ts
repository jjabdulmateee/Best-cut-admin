import { db } from "../firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
    collection,
    onSnapshot,
    doc,
    query,
    where,
    Timestamp,
    setDoc,
    limit,
    orderBy
} from "firebase/firestore";
import { Booking } from "../types/booking";
import { SystemConfig } from "../types/config";

class OpsService {
    /**
     * Listens to the global platform configuration.
     */
    subscribeToConfig(onUpdate: (config: SystemConfig) => void) {
        const configRef = doc(db, "platform", "config");
        return onSnapshot(configRef, (snap) => {
            if (snap.exists()) {
                onUpdate(snap.data() as SystemConfig);
            } else {
                // Initialize if missing
                const defaultConfig: SystemConfig = {
                    onboardingEnabled: true,
                    doorstepPlatformWide: true,
                    maxDoorstepRadius: 10000,
                    emergencyFreeze: false,
                    updatedAt: Timestamp.now(),
                    updatedBy: "system"
                };
                void setDoc(configRef, defaultConfig);
                onUpdate(defaultConfig);
            }
        });
    }

    /**
     * Updates global platform configuration via Cloud Function.
     */
    async updateConfig(adminId: string, updates: Partial<SystemConfig>) {
        const functions = getFunctions();
        const toggleFreeze = httpsCallable(functions, 'toggleEmergencyFreeze');

        if ('emergencyFreeze' in updates) {
            await toggleFreeze({
                enabled: updates.emergencyFreeze,
                reason: "Admin update from dashboard"
            });
        } else {
            // High-level config update (fallback for other fields if needed)
            const configRef = doc(db, "platform", "config");
            const { updatedBy: _, updatedAt: __, ...data } = updates;
            // Note: firestore.rules will now block this if not careful, 
            // but for now we focus on the main authority migration.
            console.warn("Direct config update attempted. Phase 1 prefers Cloud Functions.");
        }
    }

    /**
     * Listens to real-time health metrics (counts of active bookings, online barbers, etc.)
     */
    subscribeToHealth(onUpdate: (stats: any) => void) {
        const bookingsQuery = query(
            collection(db, "bookings")
        );

        const barbersRef = collection(db, "barber_applications");

        const customersQuery = query(
            collection(db, "customers")
        );

        let activeBookings = 0;
        let totalBarbers = 0;
        let onlineBarbers = 0;
        let customersOnline = 0;
        let completionRate = 100;
        let newPartnersThisWeek = 0;
        let weeklyGross = 0;

        let barberUnsubscribe: (() => void) | null = null;
        let customerUnsubscribe: (() => void) | null = null;

        const updateStats = () => {
            onUpdate({
                activeBookings,
                totalBarbers,
                onlineBarbers,
                customersOnline,
                completionRate,
                newPartnersThisWeek,
                weeklyGross
            });
        };

        // Subscribe to barbers
        barberUnsubscribe = onSnapshot(barbersRef,
            (barberSnap) => {
                const docs = barberSnap.docs.map(d => d.data());
                totalBarbers = barberSnap.size;

                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                newPartnersThisWeek = docs.filter(d => {
                    const created = d.createdAt?.toDate?.() || new Date(0);
                    return d.accountStatus === "approved" && created.getTime() >= weekAgo;
                }).length;

                onlineBarbers = docs.filter(d => {
                    if (d.accountStatus !== "approved") return false;
                    const lastSeen = d.lastActiveAt?.toDate?.() || new Date(0);
                    return (Date.now() - lastSeen.getTime()) < 30 * 60 * 1000; // Active in last 30 mins
                }).length;
                updateStats();
            }
        );

        // Subscribe to customers
        customerUnsubscribe = onSnapshot(customersQuery,
            (customerSnap) => {
                customersOnline = customerSnap.docs.filter(d => {
                    const data = d.data();
                    const lastSeen = data.lastActiveAt?.toDate?.() || new Date(0);
                    return (Date.now() - lastSeen.getTime()) < 30 * 60 * 1000; // Active in last 30 mins
                }).length;
                updateStats();
            }
        );

        // Subscribe to bookings
        const bookingsUnsubscribe = onSnapshot(bookingsQuery,
            (bookingSnap) => {
                const docs = bookingSnap.docs.map(d => d.data());
                activeBookings = docs.filter(d => ["requested", "accepted", "on_the_way", "arrived"].includes(d.status)).length;

                const completed = docs.filter(d => d.status === "completed");
                const total = docs.filter(d => ["completed", "cancelled"].includes(d.status)).length;

                completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 100;

                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                weeklyGross = completed
                    .filter(d => {
                        const created = d.createdAt?.toDate?.() || new Date(0);
                        return created.getTime() >= weekAgo;
                    })
                    .reduce((acc, d) => acc + (d.totalPrice || 0), 0);

                updateStats();
            }
        );

        return () => {
            bookingsUnsubscribe();
            if (barberUnsubscribe) barberUnsubscribe();
            if (customerUnsubscribe) customerUnsubscribe();
        };
    }

    /**
     * Listens to the latest activity across the platform.
     */
    subscribeToRecentBookings(onUpdate: (bookings: Booking[]) => void) {
        const q = query(
            collection(db, "bookings"),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        return onSnapshot(q, (snap) => {
            onUpdate(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Booking)));
        });
    }

    /**
     * Admin override for a booking via Cloud Function.
     */
    async forceAction(bookingId: string, adminId: string, action: 'cancel' | 'complete', reason: string) {
        const functions = getFunctions();

        if (action === 'cancel') {
            const cancelBooking = httpsCallable(functions, 'cancelBooking');
            await cancelBooking({ bookingId, reason });
        } else if (action === 'complete') {
            const completeBooking = httpsCallable(functions, 'completeBooking');
            await completeBooking({ bookingId });
        }
    }
}

export const opsService = new OpsService();
