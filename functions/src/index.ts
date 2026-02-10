import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db, isAdmin } from "./shared";

export * from "./booking";
export * from "./wallet";
export * from "./enforcement";
export * from "./disputes";
export * from "./config";

/**
 * Toggle Emergency Freeze (Admin only)
 */
export const toggleEmergencyFreeze = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { enabled, reason } = data;

    const callerIsAdmin = await isAdmin(context.auth.uid);
    if (!callerIsAdmin) throw new functions.https.HttpsError("permission-denied", "Unauthorized.");

    const configRef = db.doc("platform/config");
    await configRef.update({
        emergencyFreeze: enabled,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: context.auth.uid
    });

    // High-priority audit log
    await db.collection("admin_logs").add({
        adminId: context.auth.uid,
        action: enabled ? "SYSTEM_FREEZE_ACTIVATE" : "SYSTEM_FREEZE_DEACTIVATE",
        reason: reason || "Standard operation",
        timestamp: admin.firestore.Timestamp.now(),
        severity: "CRITICAL"
    });

    return { success: true };
});
