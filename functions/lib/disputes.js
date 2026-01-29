"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDispute = exports.openDispute = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const shared_1 = require("./shared");
/**
 * Open a Dispute
 * Locks the booking and escrow funds.
 */
exports.openDispute = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId, reason, details } = data;
    await (0, shared_1.assertNotFrozen)();
    return shared_1.db.runTransaction(async (transaction) => {
        const bookingRef = shared_1.db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists)
            throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        if (booking.customerId !== context.auth.uid && booking.barberId !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
        }
        if (booking.isDisputed)
            throw new functions.https.HttpsError("already-exists", "Dispute already active.");
        // 1. Create the Dispute record
        const disputeRef = shared_1.db.collection("disputes").doc();
        transaction.set(disputeRef, {
            bookingId,
            reporterId: context.auth.uid,
            targetId: booking.customerId === context.auth.uid ? booking.barberId : booking.customerId,
            reporterType: booking.customerId === context.auth.uid ? 'customer' : 'barber',
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
 * Resolve a Dispute (Admin Only) — UBER-LEVEL ESCROW VALIDATION
 *
 * SECURITY RULES:
 * 1. Admin sends ONLY refundPercentage (must be one of: 100, 90, 80, 50, 0)
 * 2. Backend calculates ALL amounts using authoritative booking.totalPrice
 * 3. Validation: refund + barber + platform === totalPrice (ENFORCED)
 * 4. Transaction atomicity ensures no partial distributions
 * 5. Platform fee = 0 if refundPercentage = 100%
 *
 * APPROVED PRESETS: 100%, 90%, 80%, 50%, 0%
 * NO CUSTOM PERCENTAGES ALLOWED
 */
exports.resolveDispute = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { disputeId, resolution, refundPercentage } = data;
    // VALIDATION 1: Admin authorization
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin)
        throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
    // VALIDATION 3: Resolution note is required
    if (!resolution || typeof resolution !== 'string' || resolution.trim().length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Resolution note is required.");
    }
    return shared_1.db.runTransaction(async (transaction) => {
        // Fetch Platform Config FIRST to validate presets
        const configSnap = await transaction.get(shared_1.db.doc('platform/config'));
        const configData = configSnap.exists ? configSnap.data() : {};
        const allowedPresets = configData.refundPresets || [100, 90, 80, 50, 0];
        const platformFeePercent = configData.platformFeePercent || 10;
        // VALIDATION 2: Refund percentage must be one of approved presets (Dynamic)
        if (typeof refundPercentage !== 'number' || !allowedPresets.includes(refundPercentage)) {
            throw new functions.https.HttpsError("invalid-argument", `refundPercentage must be one of: ${allowedPresets.join(', ')}. Received: ${refundPercentage}`);
        }
        // Fetch dispute
        const disputeRef = shared_1.db.doc(`disputes/${disputeId}`);
        const disputeSnap = await transaction.get(disputeRef);
        if (!disputeSnap.exists)
            throw new functions.https.HttpsError("not-found", "Dispute not found.");
        const dispute = disputeSnap.data();
        // VALIDATION 4: Dispute must not already be resolved
        if (dispute.status === 'resolved') {
            throw new functions.https.HttpsError("failed-precondition", "Dispute already resolved. Cannot resolve twice.");
        }
        // Fetch authoritative booking data
        const bookingRef = shared_1.db.doc(`bookings/${dispute.bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists)
            throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        // VALIDATION 5: Booking must have escrow locked
        if (!booking.isDisputed) {
            throw new functions.https.HttpsError("failed-precondition", "Booking escrow is not locked. Cannot resolve.");
        }
        // VALIDATION 6: Booking must have valid totalPrice
        const escrowedAmount = booking.totalPrice || booking.price || 0;
        if (escrowedAmount <= 0) {
            throw new functions.https.HttpsError("failed-precondition", "Invalid booking totalPrice. Cannot distribute zero funds.");
        }
        // BACKEND CALCULATION (Admin cannot manipulate)
        // Calculate refund amount
        const refundAmount = Math.round((escrowedAmount * refundPercentage) / 100 * 100) / 100;
        // Calculate remaining after refund
        const remainingAfterRefund = escrowedAmount - refundAmount;
        // Platform fee logic: 0% if full refund, otherwise apply platform fee
        const platformFee = refundPercentage === 100
            ? 0
            : Math.round((remainingAfterRefund * platformFeePercent) / 100 * 100) / 100;
        // Barber gets remaining after refund and platform fee
        const barberPayout = Math.round((remainingAfterRefund - platformFee) * 100) / 100;
        // VALIDATION 7: Mathematical integrity (prevent rounding errors)
        const totalDistributed = Math.round((refundAmount + barberPayout + platformFee) * 100) / 100;
        const discrepancy = Math.abs(totalDistributed - escrowedAmount);
        if (discrepancy > 0.02) { // Allow 2 cent tolerance for rounding
            throw new functions.https.HttpsError("internal", `Escrow validation failed: ${totalDistributed} !== ${escrowedAmount} (discrepancy: $${discrepancy})`);
        }
        // Wallet references
        const customerWalletRef = shared_1.db.doc(`wallets/${booking.customerId}`);
        const barberWalletRef = shared_1.db.doc(`wallets/${booking.barberId}`);
        const platformWalletRef = shared_1.db.doc(`wallets/PLATFORM_ACCOUNT`);
        // ATOMIC DISTRIBUTION
        // 1. Release escrow from customer and add refund to balance
        transaction.update(customerWalletRef, {
            escrowBalance: admin.firestore.FieldValue.increment(-escrowedAmount),
            balance: admin.firestore.FieldValue.increment(refundAmount),
            updatedAt: admin.firestore.Timestamp.now()
        });
        // 2. Pay barber (if any)
        if (barberPayout > 0) {
            transaction.update(barberWalletRef, {
                balance: admin.firestore.FieldValue.increment(barberPayout),
                updatedAt: admin.firestore.Timestamp.now()
            });
        }
        // 3. Platform fee collection (if any)
        if (platformFee > 0) {
            transaction.update(platformWalletRef, {
                balance: admin.firestore.FieldValue.increment(platformFee),
                updatedAt: admin.firestore.Timestamp.now()
            });
        }
        // 4. Update dispute record with full audit trail
        transaction.update(disputeRef, {
            status: "resolved",
            resolutionNote: resolution,
            resolvedAt: admin.firestore.Timestamp.now(),
            resolvedBy: context.auth.uid,
            // Store BOTH percentage and calculated amounts for audit trail
            refundPercentage,
            refundAmount,
            barberPayout,
            platformFee,
            escrowedAmount // Store what was locked at resolution time
        });
        // 5. Unlock booking
        transaction.update(bookingRef, {
            status: "resolved_dispute",
            isDisputed: false
        });
        // 6. Comprehensive audit log
        const logRef = shared_1.db.collection("admin_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth.uid,
            action: "RESOLVE_DISPUTE",
            targetId: disputeId,
            bookingId: dispute.bookingId,
            escrowedAmount,
            refundPercentage,
            refundAmount,
            barberPayout,
            platformFee,
            platformFeePercent,
            totalDistributed,
            customerId: booking.customerId,
            barberId: booking.barberId,
            timestamp: admin.firestore.Timestamp.now()
        });
        return {
            success: true,
            distribution: {
                escrowedAmount,
                refundPercentage,
                refundAmount,
                barberPayout,
                platformFee,
                totalDistributed
            }
        };
    });
});
//# sourceMappingURL=disputes.js.map