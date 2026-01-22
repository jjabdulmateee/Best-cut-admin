import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, isAdmin, assertNotFrozen } from "./shared";

/**
 * Open a Dispute
 * Locks the booking and escrow funds.
 */
export const openDispute = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId, reason, details } = data;

    await assertNotFrozen();

    return db.runTransaction(async (transaction) => {
        const bookingRef = db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists()) throw new functions.https.HttpsError("not-found", "Booking not found.");

        const booking = bookingSnap.data()!;
        if (booking.customerId !== context.auth!.uid && booking.barberId !== context.auth!.uid) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
        }

        if (booking.isDisputed) throw new functions.https.HttpsError("already-exists", "Dispute already active.");

        // 1. Create the Dispute record
        const disputeRef = db.collection("disputes").doc();
        transaction.set(disputeRef, {
            bookingId,
            reporterId: context.auth!.uid,
            targetId: booking.customerId === context.auth!.uid ? booking.barberId : booking.customerId,
            reporterType: booking.customerId === context.auth!.uid ? 'customer' : 'barber',
            reason,
            details,
            status: "open",
            createdAt: admin.firestore.Timestamp.now()
        });

        // 2. Lock the booking
        transaction.update(bookingRef, {
            isDisputed: true,
            disputeId: disputeRef.id
        });

        return { success: true, disputeId: disputeRef.id };
    });
});

/**
 * Resolve a Dispute (Admin Only)
 */
export const resolveDispute = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { disputeId, resolution, refundAmount, barberPayout } = data;

    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) throw new functions.https.HttpsError("permission-denied", "Unauthorized.");

    return db.runTransaction(async (transaction) => {
        const disputeRef = db.doc(`disputes/${disputeId}`);
        const disputeSnap = await transaction.get(disputeRef);
        if (!disputeSnap.exists()) throw new functions.https.HttpsError("not-found", "Dispute not found.");

        const dispute = disputeSnap.data()!;
        const bookingRef = db.doc(`bookings/${dispute.bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists()) throw new functions.https.HttpsError("not-found", "Booking not found.");

        const booking = bookingSnap.data()!;
        const customerWalletRef = db.doc(`wallets/${booking.customerId}`);
        const barberWalletRef = db.doc(`wallets/${booking.barberId}`);

        // Update Dispute
        transaction.update(disputeRef, {
            status: "resolved",
            resolutionNote: resolution,
            resolvedAt: admin.firestore.Timestamp.now(),
            resolvedBy: context.auth!.uid,
            refundAmount,
            barberPayout
        });

        // Clear Escrow & Distribute
        const totalHeld = booking.totalPrice || 0;
        transaction.update(customerWalletRef, {
            escrowBalance: admin.firestore.FieldValue.increment(-totalHeld),
            balance: admin.firestore.FieldValue.increment(refundAmount || 0),
            updatedAt: admin.firestore.Timestamp.now()
        });

        transaction.update(barberWalletRef, {
            balance: admin.firestore.FieldValue.increment(barberPayout || 0),
            updatedAt: admin.firestore.Timestamp.now()
        });

        transaction.update(bookingRef, {
            status: "resolved_dispute",
            isDisputed: false
        });

        // Logs
        const logRef = db.collection("admin_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth!.uid,
            action: "RESOLVE_DISPUTE",
            targetId: disputeId,
            timestamp: admin.firestore.Timestamp.now()
        });

        return { success: true };
    });
});
