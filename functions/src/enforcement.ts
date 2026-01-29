import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, isAdmin } from "./shared";

/**
 * Apply Strike (Admin Only)
 */
export const applyStrike = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { targetId, targetType, reason, severity } = data;

    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) throw new functions.https.HttpsError("permission-denied", "Unauthorized.");

    return db.runTransaction(async (transaction) => {
        const ref = targetType === 'barber' ? db.doc(`barber_applications/${targetId}`) : db.doc(`users/${targetId}`);
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new functions.https.HttpsError("not-found", "Entity not found.");

        const currentStrikes = snap.data()?.strikeCount || 0;
        const newStrikeCount = currentStrikes + 1;

        const updateData: any = {
            strikeCount: newStrikeCount,
            lastStrikeAt: admin.firestore.Timestamp.now()
        };

        // Auto-Enforcement Logic
        if (newStrikeCount >= 3) {
            updateData.accountStatus = 'disabled';
            updateData.isTerminated = true;
            updateData.terminationReason = "Automatic termination due to 3 strikes.";
        } else if (newStrikeCount === 2) {
            updateData.trustLevel = 'red';
        } else if (newStrikeCount === 1) {
            updateData.trustLevel = 'yellow';
        }

        transaction.update(ref, updateData);

        // Append to immutable log
        const logRef = db.collection("admin_enforcement_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth!.uid,
            targetId,
            targetType,
            action: "APPLY_STRIKE",
            reason,
            severity,
            newStrikeCount,
            timestamp: admin.firestore.Timestamp.now()
        });

        return { success: true, newStrikeCount };
    });
});

/**
 * Issue Penalty (Admin Only)
 */
export const issuePenalty = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { targetId, amount, reason } = data;

    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) throw new functions.https.HttpsError("permission-denied", "Unauthorized.");

    return db.runTransaction(async (transaction) => {
        const walletRef = db.doc(`wallets/${targetId}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists) throw new functions.https.HttpsError("not-found", "Wallet not found.");

        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.Timestamp.now()
        });

        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: targetId,
            amount: -amount,
            type: "penalty",
            reason,
            processedBy: context.auth!.uid,
            timestamp: admin.firestore.Timestamp.now()
        });

        const logRef = db.collection("admin_enforcement_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth!.uid,
            targetId,
            action: "ISSUE_PENALTY",
            amount,
            reason,
            timestamp: admin.firestore.Timestamp.now()
        });

        return { success: true };
    });
});
