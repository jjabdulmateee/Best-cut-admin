import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export interface RequestBookingParams {
    barberId: string;
    serviceId: string; // e.g., "haircut"
    serviceType: 'shop' | 'doorstep';
    location?: { lat: number; lng: number }; // User location for doorstep
    notes?: string;
    customerId?: string; // Admin override to book on behalf of user
}

export interface RequestBookingResponse {
    bookingId: string;
    totalPrice: number;
    status: string;
}

class BookingService {
    /**
     * Request a new booking via Cloud Function.
     * Enforces authoritative pricing and escrow locking.
     */
    async requestBooking(params: RequestBookingParams): Promise<RequestBookingResponse> {
        try {
            const requestBookingFn = httpsCallable<RequestBookingParams, RequestBookingResponse>(
                functions,
                'requestBooking'
            );
            const result = await requestBookingFn(params);
            return result.data;
        } catch (error) {
            console.error("Booking Request Failed:", error);
            throw error;
        }
    }
}

export const bookingService = new BookingService();
