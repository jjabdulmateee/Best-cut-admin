import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, assertNotFrozen, assertUserActive, assertBarberActive, isAdmin } from "./shared";

/**
 * Pay from Wallet (Customer only)
 */
export const payFromWallet = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { amount, bookingId } = data;

    await assertNotFrozen();
    await assertUserActive(context.auth.uid);

    return db.runTransaction(async (transaction) => {
        const walletRef = db.doc(`wallets/${context.auth!.uid}`);
        const walletSnap = await transaction.get(walletRef);

        if (!walletSnap.exists()) throw new functions.https.HttpsError("not-found", "Wallet not found.");
        const balance = walletSnap.data()!.balance;

        if (balance < amount) throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");

        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            escrowBalance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.Timestamp.now()
        });

        // Log the transaction
        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: context.auth!.uid,
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
export const refundToWallet = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { userId, amount, bookingId, reason } = data;

    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) throw new functions.https.HttpsError("permission-denied", "Only admins can issue refunds.");

    return db.runTransaction(async (transaction) => {
        const walletRef = db.doc(`wallets/${userId}`);
        const walletSnap = await transaction.get(walletRef);

        if (!walletSnap.exists()) throw new functions.https.HttpsError("not-found", "User wallet not found.");

        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.Timestamp.now()
        });

        // Log transaction
        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
            userId,
            bookingId,
            amount,
            type: "refund",
            reason,
            processedBy: context.auth!.uid,
            timestamp: admin.firestore.Timestamp.now()
        });

        // Log admin action
        const logRef = db.collection("admin_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth!.uid,
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
export const withdrawBarberFunds = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { barberId, amount } = data;

    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) {
        await assertNotFrozen();
        await assertBarberActive(context.auth.uid);
        if (context.auth.uid !== barberId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized withdrawal.");
        }
    }

    return db.runTransaction(async (transaction) => {
        const walletRef = db.doc(`wallets/${barberId}`);
        const walletSnap = await transaction.get(walletRef);

        if (!walletSnap.exists()) throw new functions.https.HttpsError("not-found", "Wallet not found.");
        const balance = walletSnap.data()!.balance;

        if (balance < amount) throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");

        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.Timestamp.now()
        });

        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: barberId,
            amount: -amount,
            type: "withdrawal",
            timestamp: admin.firestore.Timestamp.now(),
            processedBy: context.auth!.uid
        });

        if (callerIsAdmin) {
            const logRef = db.collection("admin_logs").doc();
            transaction.set(logRef, {
                adminId: context.auth!.uid,
                action: "FORCE_WITHDRAWAL",
                targetId: barberId,
                amount,
                timestamp: admin.firestore.Timestamp.now()
            });
        }

        return { success: true };
    });
});
