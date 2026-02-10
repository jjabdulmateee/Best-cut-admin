"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminWithdraw = exports.adminRefund = exports.payFromWallet = void 0;
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
 * Admin Refund (Admin only)
 * Phase 4.1.B - Refund Guardrails:
 * - Hard limit enforcement (maxSingleRefundAmount)
 * - Dual admin approval for large refunds (largeRefundThreshold)
 * - Enhanced audit logging with before/after balances
 */
exports.adminRefund = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { userId, amount, bookingId, reason, secondaryAdminId } = data;
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin)
        throw new functions.https.HttpsError("permission-denied", "Only admins can issue refunds.");
    // PHASE 4.1.B - Fetch refund limits from config
    const configSnap = await shared_1.db.doc('platform/config').get();
    if (!configSnap.exists) {
        throw new functions.https.HttpsError("failed-precondition", "Platform config not found. Refunds are disabled for safety.");
    }
    const config = configSnap.data();
    const maxSingleRefundAmount = config.maxSingleRefundAmount || 1000;
    const largeRefundThreshold = config.largeRefundThreshold || 700;
    // VALIDATION 1: Hard limit enforcement
    if (amount > maxSingleRefundAmount) {
        throw new functions.https.HttpsError("invalid-argument", `Refund amount $${amount} exceeds maximum allowed $${maxSingleRefundAmount}`);
    }
    // VALIDATION 2: Dual admin approval for large refunds
    const requiresDualApproval = amount > largeRefundThreshold;
    if (requiresDualApproval) {
        if (!secondaryAdminId) {
            throw new functions.https.HttpsError("invalid-argument", `Refund amount $${amount} exceeds threshold $${largeRefundThreshold}. Secondary admin approval required.`);
        }
        // Verify secondary admin
        const secondaryIsAdmin = await (0, shared_1.isAdmin)(secondaryAdminId);
        if (!secondaryIsAdmin) {
            throw new functions.https.HttpsError("invalid-argument", "Secondary approver is not a valid admin.");
        }
        // Prevent self-approval
        if (context.auth.uid === secondaryAdminId) {
            throw new functions.https.HttpsError("invalid-argument", "Primary and secondary admin cannot be the same person.");
        }
    }
    return shared_1.db.runTransaction(async (transaction) => {
        const walletRef = shared_1.db.doc(`wallets/${userId}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists)
            throw new functions.https.HttpsError("not-found", "User wallet not found.");
        const wallet = walletSnap.data();
        const beforeBalance = wallet.balance || 0;
        const beforeEscrow = wallet.escrowBalance || 0;
        const afterBalance = beforeBalance + amount;
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.Timestamp.now()
        });
        // Log transaction with before/after balances (Phase 4.1.D)
        const txRef = shared_1.db.collection("transactions").doc();
        transaction.set(txRef, {
            userId,
            bookingId,
            amount,
            type: "refund",
            reason,
            processedBy: context.auth.uid,
            timestamp: admin.firestore.Timestamp.now(),
            // Phase 4.1.D - Audit trail
            beforeBalance,
            afterBalance,
            beforeEscrow,
            afterEscrow: beforeEscrow
        });
        // Log admin action with dual approval info
        const logRef = shared_1.db.collection("admin_logs").doc();
        transaction.set(logRef, {
            adminId: context.auth.uid,
            secondaryAdminId: requiresDualApproval ? secondaryAdminId : null,
            requiresDualApproval,
            action: "ISSUE_REFUND",
            targetId: userId,
            amount,
            beforeBalance,
            afterBalance,
            reason,
            refundLimitConfig: {
                maxSingleRefundAmount,
                largeRefundThreshold
            },
            timestamp: admin.firestore.Timestamp.now()
        });
        return { success: true, requiresDualApproval };
    });
});
/**
 * Admin Withdraw (Admin or Barber)
 * Phase 4.1.C - Withdrawal Safety:
 * - Check wallet not frozen
 * - Ensure escrowBalance === 0
 * - Enhanced audit logging with before/after balances
 * - Require reason for admin-forced withdrawals
 */
exports.adminWithdraw = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { barberId, amount, reason } = data;
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin) {
        await (0, shared_1.assertNotFrozen)();
        await (0, shared_1.assertBarberActive)(context.auth.uid);
        if (context.auth.uid !== barberId) {
            throw new functions.https.HttpsError("permission-denied", "Unauthorized withdrawal.");
        }
    }
    // Phase 4.1.C - Require reason for admin-forced withdrawals
    if (callerIsAdmin && !reason) {
        throw new functions.https.HttpsError("invalid-argument", "Reason is required for admin-forced withdrawals.");
    }
    return shared_1.db.runTransaction(async (transaction) => {
        const walletRef = shared_1.db.doc(`wallets/${barberId}`);
        const walletSnap = await transaction.get(walletRef);
        if (!walletSnap.exists)
            throw new functions.https.HttpsError("not-found", "Wallet not found.");
        const wallet = walletSnap.data();
        const beforeBalance = wallet.balance || 0;
        const beforeEscrow = wallet.escrowBalance || 0;
        // PHASE 4.1.C - VALIDATION 1: Check wallet not frozen
        if (wallet.isFrozen) {
            throw new functions.https.HttpsError("failed-precondition", "Wallet is frozen. Cannot process withdrawal.");
        }
        // PHASE 4.1.C - VALIDATION 2: Ensure escrow balance is zero
        if (beforeEscrow > 0) {
            throw new functions.https.HttpsError("failed-precondition", `Cannot withdraw while funds are locked in escrow. Escrow balance: $${beforeEscrow}`);
        }
        // VALIDATION 3: Sufficient balance
        if (beforeBalance < amount) {
            throw new functions.https.HttpsError("failed-precondition", `Insufficient funds. Balance: $${beforeBalance}, Requested: $${amount}`);
        }
        const afterBalance = beforeBalance - amount;
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.Timestamp.now()
        });
        // Log transaction with before/after balances (Phase 4.1.D)
        const txRef = shared_1.db.collection("transactions").doc();
        transaction.set(txRef, {
            userId: barberId,
            amount: -amount,
            type: "withdrawal",
            reason: reason || "Barber withdrawal",
            timestamp: admin.firestore.Timestamp.now(),
            processedBy: context.auth.uid,
            // Phase 4.1.D - Audit trail
            beforeBalance,
            afterBalance,
            beforeEscrow,
            afterEscrow: beforeEscrow,
            status: "completed"
        });
        // Enhanced admin logging
        if (callerIsAdmin) {
            const logRef = shared_1.db.collection("admin_logs").doc();
            transaction.set(logRef, {
                adminId: context.auth.uid,
                action: "FORCE_WITHDRAWAL",
                targetId: barberId,
                amount,
                beforeBalance,
                afterBalance,
                escrowBalanceAtWithdrawal: beforeEscrow,
                reason,
                timestamp: admin.firestore.Timestamp.now()
            });
        }
        return { success: true };
    });
});
//# sourceMappingURL=wallet.js.map