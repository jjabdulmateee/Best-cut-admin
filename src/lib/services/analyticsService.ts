import { db } from "../firebase/config";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { UserStats } from "../types/analytics";

class AnalyticsService {
    /**
     * Subscribe to real-time user analytics
     */
    subscribeToUserStats(onUpdate: (stats: UserStats) => void) {
        const barbersRef = collection(db, "barber_applications");
        const customersRef = collection(db, "customers");

        let barberData: any[] = [];
        let customerData: any[] = [];
        let barberUnsubscribe: (() => void) | null = null;
        let customerUnsubscribe: (() => void) | null = null;

        const calculateStats = () => {
            const now = Date.now();
            const onlineThreshold = 5 * 60 * 1000; // 5 minutes
            const activeThreshold = 24 * 60 * 60 * 1000; // 24 hours
            const monthlyThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
            const todayStart = new Date().setHours(0, 0, 0, 0);
            const weekStart = now - 7 * 24 * 60 * 60 * 1000;
            const monthStart = now - 30 * 24 * 60 * 60 * 1000;

            const allUsers = [...barberData, ...customerData];

            const stats: UserStats = {
                totalUsers: allUsers.length,
                totalBarbers: barberData.length,
                totalCustomers: customerData.length,
                activeUsers: allUsers.filter(user => {
                    const lastActive = user.lastActiveAt?.toDate?.() || user.createdAt?.toDate?.() || new Date(0);
                    return (now - lastActive.getTime()) < activeThreshold;
                }).length,
                monthlyActiveUsers: allUsers.filter(user => {
                    const lastActive = user.lastActiveAt?.toDate?.() || user.createdAt?.toDate?.() || new Date(0);
                    return (now - lastActive.getTime()) < monthlyThreshold;
                }).length,
                onlineUsers: allUsers.filter(user => {
                    const lastActive = user.lastActiveAt?.toDate?.() || new Date(0);
                    return (now - lastActive.getTime()) < onlineThreshold;
                }).length,
                newUsersToday: allUsers.filter(user => {
                    const created = user.createdAt?.toDate?.() || new Date(0);
                    return created.getTime() >= todayStart;
                }).length,
                newUsersThisWeek: allUsers.filter(user => {
                    const created = user.createdAt?.toDate?.() || new Date(0);
                    return created.getTime() >= weekStart;
                }).length,
                newUsersThisMonth: allUsers.filter(user => {
                    const created = user.createdAt?.toDate?.() || new Date(0);
                    return created.getTime() >= monthStart;
                }).length,
            };

            onUpdate(stats);
        };

        // Subscribe to barbers
        barberUnsubscribe = onSnapshot(
            barbersRef,
            (snapshot) => {
                barberData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                calculateStats();
            },
            (error) => {
                console.error("Barbers subscription error:", error);
            }
        );

        // Subscribe to customers
        customerUnsubscribe = onSnapshot(
            customersRef,
            (snapshot) => {
                customerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                calculateStats();
            },
            (error) => {
                console.error("Customers subscription error:", error);
            }
        );

        // Return cleanup function that unsubscribes from BOTH listeners
        return () => {
            if (barberUnsubscribe) {
                barberUnsubscribe();
            }
            if (customerUnsubscribe) {
                customerUnsubscribe();
            }
        };
    }
}

export const analyticsService = new AnalyticsService();
