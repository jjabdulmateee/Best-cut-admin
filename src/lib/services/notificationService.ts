import { db } from "../firebase/config";
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    Timestamp,
    addDoc
} from "firebase/firestore";
import { AdminNotification } from "../types/notification";

class NotificationService {
    /**
     * Listens for active admin notifications.
     */
    subscribeToNotifications(onUpdate: (notifications: AdminNotification[]) => void) {
        const q = query(
            collection(db, "notifications"),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(q, (snap) => {
            onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotification)));
        });
    }

    /**
     * Marks a notification as resolved.
     */
    async resolveNotification(notificationId: string, adminId: string) {
        const ref = doc(db, "notifications", notificationId);
        await updateDoc(ref, {
            status: "resolved",
            resolvedAt: Timestamp.now(),
            resolvedBy: adminId
        });
    }

    /**
     * Manually creates an alert (can be used by client-side risk engine)
     */
    async createAlert(alert: Omit<AdminNotification, 'id' | 'status' | 'createdAt'>) {
        await addDoc(collection(db, "notifications"), {
            ...alert,
            status: "active",
            createdAt: Timestamp.now()
        });
    }
}

export const notificationService = new NotificationService();
