import { Timestamp } from "firebase/firestore";

export type BookingStatus =
    | 'requested'   // Customer has requested, waiting for barber
    | 'accepted'    // Barber has accepted
    | 'on_the_way'  // Barber is moving to customer
    | 'arrived'     // Barber has arrived at customer/shop
    | 'completed'   // Service finished
    | 'cancelled';  // Terminated early

export interface Booking {
    uid: string;
    barberId: string;
    barberName: string;
    customerId: string;
    customerName: string;
    status: BookingStatus;
    serviceType: 'shop' | 'doorstep';
    serviceName: string; // Specific service requested (e.g. "Haircut", "Beard Trim")
    price: number;
    totalPrice?: number; // Total including fees (used for escrow validation)
    createdAt: Timestamp;
    completedAt?: Timestamp;
    cancelledAt?: Timestamp;
    cancelledBy?: 'admin' | 'barber' | 'customer';
    cancellationReason?: string;
    location?: {
        lat: number;
        lng: number;
    };
    notes?: string;
    // Governance (Phase 3)
    isDisputed?: boolean;
    disputeId?: string;
}
