"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleEmergencyFreeze = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const shared_1 = require("./shared");
__exportStar(require("./booking"), exports);
__exportStar(require("./wallet"), exports);
__exportStar(require("./enforcement"), exports);
__exportStar(require("./disputes"), exports);
__exportStar(require("./config"), exports);
/**
 * Toggle Emergency Freeze (Admin only)
 */
exports.toggleEmergencyFreeze = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { enabled, reason } = data;
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin)
        throw new functions.https.HttpsError("permission-denied", "Unauthorized.");
    const configRef = shared_1.db.doc("platform/config");
    await configRef.update({
        emergencyFreeze: enabled,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: context.auth.uid
    });
    // High-priority audit log
    await shared_1.db.collection("admin_logs").add({
        adminId: context.auth.uid,
        action: enabled ? "SYSTEM_FREEZE_ACTIVATE" : "SYSTEM_FREEZE_DEACTIVATE",
        reason: reason || "Standard operation",
        timestamp: admin.firestore.Timestamp.now(),
        severity: "CRITICAL"
    });
    return { success: true };
});
//# sourceMappingURL=index.js.map