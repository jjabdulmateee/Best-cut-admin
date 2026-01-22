import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, assertNotFrozen, assertBarberActive, assertUserActive, isAdmin } from "./shared";

/**
 * Accept a booking (Barber only)
 */
export const acceptBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId } = data;

    await assertNotFrozen();
    await assertBarberActive(context.auth.uid);

    return db.runTransaction(async (transaction) => {
        const bookingRef = db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);

        if (!bookingSnap.exists()) throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data()!;

        if (booking.barberId !== context.auth!.uid) {
            throw new functions.https.HttpsError("permission-denied", "You are not assigned to this booking.");
        }

        if (booking.status !== "requested") {
            throw new functions.https.HttpsError("failed-precondition", "Booking must be in requested state.");
        }

        transaction.update(bookingRef, {
            status: "accepted",
            acceptedAt: admin.firestore.Timestamp.now()
        });

        return { success: true };
    });
});

/**
 * Complete a booking (Barber or Admin)
 */
export const completeBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId } = data;

    await assertNotFrozen();

    return db.runTransaction(async (transaction) => {
        const bookingRef = db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);

        if (!bookingSnap.exists()) throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data()!;

        const isAuthorized = booking.barberId === context.auth!.uid || await isAdmin(context.auth!.uid);
        if (!isAuthorized) throw new functions.https.HttpsError("permission-denied", "Unauthorized to complete this booking.");

        transaction.update(bookingRef, {
            status: "completed",
            completedAt: admin.firestore.Timestamp.now()
        });

        // ESCROW RELEASE LOGIC (Phase 3)
        const customerWalletRef = db.doc(`wallets/${booking.customerId}`);
        const barberWalletRef = db.doc(`wallets/${booking.barberId}`);

        const customerWallet = await transaction.get(customerWalletRef);
        if (customerWallet.exists()) {
            const amount = booking.totalPrice || 0;
            transaction.update(customerWalletRef, {
                escrowBalance: admin.firestore.FieldValue.increment(-amount),
                updatedAt: admin.firestore.Timestamp.now()
            });

            transaction.update(barberWalletRef, {
                balance: admin.firestore.FieldValue.increment(amount),
                updatedAt: admin.firestore.Timestamp.now()
            });

            // Log the release transaction
            const txRef = db.collection("transactions").doc();
            transaction.set(txRef, {
                userId: booking.barberId,
                bookingId,
                amount: amount,
                type: "escrow_release",
                status: "completed",
                timestamp: admin.firestore.Timestamp.now()
            });
        }

        return { success: true };
    });
});

/**
 * Cancel a booking (Admin Override Support)
 */
export const cancelBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId, reason } = data;

    // Check freeze status (Admins can override freeze for emergency cancellations)
    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) await assertNotFrozen();

    return db.runTransaction(async (transaction) => {
        const bookingRef = db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);

        if (!bookingSnap.exists()) throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data()!;

        transaction.update(bookingRef, {
            status: "cancelled",
            cancelledAt: admin.firestore.Timestamp.now(),
            cancelledBy: callerIsAdmin ? "admin" : (booking.barberId === context.auth!.uid ? "barber" : "customer"),
            cancellationReason: reason
        });

        // If admin cancelled, log it
        if (callerIsAdmin) {
            const logRef = db.collection("admin_logs").doc();
            transaction.set(logRef, {
                adminId: context.auth!.uid,
                action: "FORCE_CANCEL_BOOKING",
                targetId: bookingId,
                reason,
                timestamp: admin.firestore.Timestamp.now()
            });
        }

        return { success: true };
    });
});

/**
 * Reject a booking (Barber only)
 */
export const rejectBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId, reason } = data;

    await assertNotFrozen();
    await assertBarberActive(context.auth.uid);

    return db.runTransaction(async (transaction) => {
        const bookingRef = db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);

        if (!bookingSnap.exists()) throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data()!;

        if (booking.barberId !== context.auth!.uid) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
        }

        transaction.update(bookingRef, {
            status: "cancelled", // In this system, rejection leads to cancellation or back to requested
            cancelledAt: admin.firestore.Timestamp.now(),
            cancelledBy: "barber",
            cancellationReason: reason
        });

        return { success: true };
    });
});
