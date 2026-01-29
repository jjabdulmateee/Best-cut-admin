"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireBooking = exports.rejectBooking = exports.cancelBooking = exports.completeBooking = exports.acceptBooking = exports.requestBooking = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const shared_1 = require("./shared");
/**
 * Request a booking (Customer or Admin)
 */
exports.requestBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    // Inputs
    const { barberId, serviceId, serviceType, location, notes, customerId } = data;
    // Checks
    await (0, shared_1.assertNotFrozen)();
    // Determine Customer ID (Admin override support)
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    const targetCustomerId = (callerIsAdmin && customerId) ? customerId : context.auth.uid;
    await (0, shared_1.assertUserActive)(targetCustomerId);
    return shared_1.db.runTransaction(async (transaction) => {
        // 1. Fetch Barber & Validate
        const barberRef = shared_1.db.doc(`barber_applications/${barberId}`);
        const barberSnap = await transaction.get(barberRef);
        if (!barberSnap.exists)
            throw new functions.https.HttpsError("not-found", "Barber not found.");
        const barber = barberSnap.data();
        if (barber.accountStatus !== 'approved' || barber.isBanned) {
            throw new functions.https.HttpsError("failed-precondition", "Barber is not available.");
        }
        // 2. Pricing Logic (Server authority)
        // Check both 'pricing' and 'services' maps as fallback if pricing is not structured as expected
        const pricing = barber.pricing || {};
        const basePrice = pricing[serviceId];
        if (basePrice === undefined) {
            throw new functions.https.HttpsError("not-found", `Service '${serviceId}' not found for this barber.`);
        }
        // Platform Fee Logic (Read config or default)
        const configSnap = await transaction.get(shared_1.db.doc('platform/config'));
        const feePercent = configSnap.exists ? (configSnap.data().platformFeePercent || 10) : 10;
        const platformFee = Math.round((basePrice * feePercent) / 100 * 100) / 100;
        const totalPrice = Math.round((basePrice + platformFee) * 100) / 100;
        // 3. Customer Wallet & Validation
        const walletRef = shared_1.db.doc(`wallets/${targetCustomerId}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists)
            throw new functions.https.HttpsError("not-found", "Customer wallet not initialized.");
        const wallet = walletSnap.data();
        if (wallet.balance < totalPrice) {
            throw new functions.https.HttpsError("failed-precondition", `Insufficient funds. Balance: ${wallet.balance}, Required: ${totalPrice}`);
        }
        // 4. Create Booking
        const bookingRef = shared_1.db.collection("bookings").doc();
        const now = admin.firestore.Timestamp.now();
        // Fetch Customer Profile for Name
        const customerRef = shared_1.db.doc(`users/${targetCustomerId}`);
        const customerSnap = await transaction.get(customerRef);
        const customerName = customerSnap.exists ? customerSnap.data().displayName || "Unknown" : "Unknown";
        transaction.set(bookingRef, {
            uid: bookingRef.id,
            barberId,
            barberName: barber.name || "Unknown Barber",
            customerId: targetCustomerId,
            customerName,
            status: "requested",
            serviceType,
            serviceName: serviceId,
            price: basePrice,
            totalPrice,
            platformFee,
            location,
            notes,
            createdAt: now
        });
        // 5. Escrow Lock
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-totalPrice),
            escrowBalance: admin.firestore.FieldValue.increment(totalPrice),
            updatedAt: now
        });
        // 6. Transaction Record
        const txRef = shared_1.db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: targetCustomerId,
            bookingId: bookingRef.id,
            amount: totalPrice,
            type: "escrow_hold",
            status: "completed",
            timestamp: now
        });
        return { bookingId: bookingRef.id, totalPrice, status: 'requested' };
    });
});
/**
 * Accept a booking (Barber only)
 */
exports.acceptBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId } = data;
    await (0, shared_1.assertNotFrozen)();
    await (0, shared_1.assertBarberActive)(context.auth.uid);
    return shared_1.db.runTransaction(async (transaction) => {
        const bookingRef = shared_1.db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists)
            throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        if (booking.barberId !== context.auth.uid) {
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
/**
 * Complete a booking (Barber or Admin)
 */
exports.completeBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId } = data;
    await (0, shared_1.assertNotFrozen)();
    return shared_1.db.runTransaction(async (transaction) => {
        const bookingRef = shared_1.db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists)
            throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        const isAuthorized = booking.barberId === context.auth.uid || await (0, shared_1.isAdmin)(context.auth.uid);
        if (!isAuthorized)
            throw new functions.https.HttpsError("permission-denied", "Unauthorized to complete this booking.");
        if (booking.status !== "accepted" && booking.status !== "on_the_way" && booking.status !== "arrived") {
            throw new functions.https.HttpsError("failed-precondition", "Booking is not in active state.");
        }
        transaction.update(bookingRef, {
            status: "completed",
            completedAt: admin.firestore.Timestamp.now()
        });
        // FINANCIAL SETTLEMENT
        // 1. Release Total from Customer Escrow
        const customerWalletRef = shared_1.db.doc(`wallets/${booking.customerId}`);
        const barberWalletRef = shared_1.db.doc(`wallets/${booking.barberId}`);
        const customerWallet = await transaction.get(customerWalletRef);
        // Safety: Ensure wallet logic runs. Wallet existence SHOULD be guaranteed by booking creation, but we check.
        if (customerWallet.exists) {
            const totalPrice = booking.totalPrice || 0;
            const basePrice = booking.price || 0;
            const platformFee = booking.platformFee || 0;
            // a) Unlock Customer Escrow (Total)
            transaction.update(customerWalletRef, {
                escrowBalance: admin.firestore.FieldValue.increment(-totalPrice),
                updatedAt: admin.firestore.Timestamp.now()
            });
            // b) Pay Barber (Base Price only)
            transaction.update(barberWalletRef, {
                balance: admin.firestore.FieldValue.increment(basePrice),
                updatedAt: admin.firestore.Timestamp.now()
            });
            // c) Log Barber Payment
            const payTxRef = shared_1.db.collection("transactions").doc();
            transaction.set(payTxRef, {
                userId: booking.barberId,
                bookingId,
                amount: basePrice,
                type: "payment",
                status: "completed",
                timestamp: admin.firestore.Timestamp.now()
            });
            // d) Log Platform Fee Collection (Implicitly kept, but logged for audit)
            const feeTxRef = shared_1.db.collection("transactions").doc();
            transaction.set(feeTxRef, {
                userId: "PLATFORM",
                bookingId,
                amount: platformFee,
                type: "platform_fee",
                status: "collected",
                timestamp: admin.firestore.Timestamp.now()
            });
        }
        return { success: true };
    });
});
/**
 * Cancel a booking (Admin Override Support)
 */
exports.cancelBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId, reason } = data;
    // Check freeze status (Admins can override freeze for emergency cancellations)
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin)
        await (0, shared_1.assertNotFrozen)();
    return shared_1.db.runTransaction(async (transaction) => {
        const bookingRef = shared_1.db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists)
            throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        transaction.update(bookingRef, {
            status: "cancelled",
            cancelledAt: admin.firestore.Timestamp.now(),
            cancelledBy: callerIsAdmin ? "admin" : (booking.barberId === context.auth.uid ? "barber" : "customer"),
            cancellationReason: reason
        });
        // ESCROW REFUND LOGIC
        // Regardless of who cancelled (for now), fully refund the customer from Escrow -> Balance
        const customerWalletRef = shared_1.db.doc(`wallets/${booking.customerId}`);
        const customerWallet = await transaction.get(customerWalletRef);
        if (customerWallet.exists) {
            const totalPrice = booking.totalPrice || 0;
            transaction.update(customerWalletRef, {
                escrowBalance: admin.firestore.FieldValue.increment(-totalPrice),
                balance: admin.firestore.FieldValue.increment(totalPrice),
                updatedAt: admin.firestore.Timestamp.now()
            });
            // Log refund transaction
            const refundTxRef = shared_1.db.collection("transactions").doc();
            transaction.set(refundTxRef, {
                userId: booking.customerId,
                bookingId,
                amount: totalPrice,
                type: "escrow_refund",
                status: "completed",
                timestamp: admin.firestore.Timestamp.now(),
                reason: `Booking cancelled by ${callerIsAdmin ? "admin" : (booking.barberId === context.auth.uid ? "barber" : "customer")}`
            });
        }
        // If admin cancelled, log it
        if (callerIsAdmin) {
            const logRef = shared_1.db.collection("admin_logs").doc();
            transaction.set(logRef, {
                adminId: context.auth.uid,
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
exports.rejectBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { bookingId, reason } = data;
    await (0, shared_1.assertNotFrozen)();
    await (0, shared_1.assertBarberActive)(context.auth.uid);
    return shared_1.db.runTransaction(async (transaction) => {
        const bookingRef = shared_1.db.doc(`bookings/${bookingId}`);
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists)
            throw new functions.https.HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        if (booking.barberId !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
        }
        transaction.update(bookingRef, {
            status: "cancelled",
            cancelledAt: admin.firestore.Timestamp.now(),
            cancelledBy: "barber",
            cancellationReason: reason
        });
        // ESCROW REFUND LOGIC
        const customerWalletRef = shared_1.db.doc(`wallets/${booking.customerId}`);
        const customerWallet = await transaction.get(customerWalletRef);
        if (customerWallet.exists) {
            const totalPrice = booking.totalPrice || 0;
            transaction.update(customerWalletRef, {
                escrowBalance: admin.firestore.FieldValue.increment(-totalPrice),
                balance: admin.firestore.FieldValue.increment(totalPrice),
                updatedAt: admin.firestore.Timestamp.now()
            });
            // Log refund transaction
            const refundTxRef = shared_1.db.collection("transactions").doc();
            transaction.set(refundTxRef, {
                userId: booking.customerId,
                bookingId,
                amount: totalPrice,
                type: "escrow_refund",
                status: "completed",
                timestamp: admin.firestore.Timestamp.now(),
                reason: `Booking rejected by barber: ${reason || "No reason"}`
            });
        }
        return { success: true };
    });
});
/**
 * Expire stale bookings (Scheduled every 30 mins)
 */
exports.expireBooking = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
    const NOW = admin.firestore.Timestamp.now();
    const CUTOFF = new Date(NOW.toMillis() - 30 * 60 * 1000); // 30 mins ago
    const snapshot = await shared_1.db.collection('bookings')
        .where('status', '==', 'requested')
        .where('createdAt', '<=', CUTOFF)
        .get();
    if (snapshot.empty) {
        console.log("No stale bookings found.");
        return null;
    }
    console.log(`Found ${snapshot.size} stale bookings.`);
    const promises = snapshot.docs.map(async (docSnap) => {
        const bookingId = docSnap.id;
        const booking = docSnap.data();
        try {
            await shared_1.db.runTransaction(async (transaction) => {
                const freshBookingSnap = await transaction.get(docSnap.ref);
                if (!freshBookingSnap.exists)
                    return;
                const freshBooking = freshBookingSnap.data();
                if (freshBooking.status !== 'requested')
                    return; // Already handled
                // Cancel It
                transaction.update(docSnap.ref, {
                    status: 'cancelled',
                    cancelledAt: NOW,
                    cancelledBy: 'system',
                    cancellationReason: 'expired (no barber response)'
                });
                // Refund Escrow
                const customerWalletRef = shared_1.db.doc(`wallets/${booking.customerId}`);
                const customerWallet = await transaction.get(customerWalletRef);
                if (customerWallet.exists) {
                    const totalPrice = booking.totalPrice || 0;
                    transaction.update(customerWalletRef, {
                        escrowBalance: admin.firestore.FieldValue.increment(-totalPrice),
                        balance: admin.firestore.FieldValue.increment(totalPrice),
                        updatedAt: NOW
                    });
                    const refundTxRef = shared_1.db.collection("transactions").doc();
                    transaction.set(refundTxRef, {
                        userId: booking.customerId,
                        bookingId,
                        amount: totalPrice,
                        type: "escrow_refund",
                        status: "completed",
                        timestamp: NOW,
                        reason: 'Booking expired'
                    });
                }
            });
            console.log(`Expired booking ${bookingId}`);
        }
        catch (err) {
            console.error(`Failed to expire booking ${bookingId}`, err);
        }
    });
    await Promise.all(promises);
    return null;
});
//# sourceMappingURL=booking.js.map