"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawBarberFunds = exports.refundToWallet = exports.payFromWallet = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const shared_1 = require("./shared");
/**
 * Pay from Wallet (Customer only)
 */
exports.payFromWallet = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { amount, bookingId } = data;
    await (0, shared_1.assertNotFrozen)();
    await (0, shared_1.assertUserActive)(context.auth.uid);
    return shared_1.db.runTransaction(async (transaction) => {
        const walletRef = shared_1.db.doc(`wallets/${context.auth.uid}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists)
            throw new functions.https.HttpsError("not-found", "Wallet not found.");
        const balance = walletSnap.data().balance;
        if (balance < amount)
            throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            escrowBalance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.Timestamp.now()
        });
        // Log the transaction
        const txRef = shared_1.db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: context.auth.uid,
            bookingId,
            amount: -amount,
            type: "escrow_hold",
            status: "completed",
            timestamp: admin.firestore.Timestamp.now()
        });
        return { success: true };
    });
});
/**
 * Refund to Wallet (Admin only)
 */
exports.refundToWallet = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { userId, amount, bookingId, reason } = data;
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin)
        throw new functions.https.HttpsError("permission-denied", "Only admins can issue refunds.");
    return shared_1.db.runTransaction(async (transaction) => {
        const walletRef = shared_1.db.doc(`wallets/${userId}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists)
            throw new functions.https.HttpsError("not-found", "User wallet not found.");
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.Timestamp.now()
        });
        // Log transaction
        const txRef = shared_1.db.collection("transactions").doc();
        transaction.set(txRef, {
            userId,
            bookingId,
            amount,
            type: "refund",
            reason,
            processedBy: context.auth.uid,
            timestamp: admin.firestore.Timestamp.now()
        });
        // Log admin action
        const logRef = shared_1.db.collection("admin_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth.uid,
            action: "ISSUE_REFUND",
            targetId: userId,
            reason,
            timestamp: admin.firestore.Timestamp.now()
        });
        return { success: true };
    });
});
/**
 * Withdraw Barber Funds
 */
exports.withdrawBarberFunds = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { barberId, amount } = data;
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin) {
        await (0, shared_1.assertNotFrozen)();
        await (0, shared_1.assertBarberActive)(context.auth.uid);
        if (context.auth.uid !== barberId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized withdrawal.");
        }
    }
    return shared_1.db.runTransaction(async (transaction) => {
        const walletRef = shared_1.db.doc(`wallets/${barberId}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists)
            throw new functions.https.HttpsError("not-found", "Wallet not found.");
        const balance = walletSnap.data().balance;
        if (balance < amount)
            throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.Timestamp.now()
        });
        const txRef = shared_1.db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: barberId,
            amount: -amount,
            type: "withdrawal",
            timestamp: admin.firestore.Timestamp.now(),
            processedBy: context.auth.uid
        });
        if (callerIsAdmin) {
            const logRef = shared_1.db.collection("admin_logs").doc();
            transaction.set(logRef, {
                adminId: context.auth.uid,
                action: "FORCE_WITHDRAWAL",
                targetId: barberId,
                amount,
                timestamp: admin.firestore.Timestamp.now()
            });
        }
        return { success: true };
    });
});
//# sourceMappingURL=wallet.js.map