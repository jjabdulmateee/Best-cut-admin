import { Timestamp } from "firebase/firestore";

export type NotificationType =
    | 'BOOKING_ISSUE'
    | 'PAYMENT_FAIL'
    | 'ADMIN_OVERRIDE'
    | 'USER_RISK'
    | 'BARBER_RISK';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AdminNotification {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    message: string;
    entityId: string; // ID of the related Booking, Barber, or User
    entityType: 'booking' | 'barber' | 'user';
    status: 'active' | 'resolved';
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    resolvedBy?: string; // Admin UID
}
