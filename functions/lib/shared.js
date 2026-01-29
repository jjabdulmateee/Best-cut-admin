"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.assertBarberActive = exports.assertUserActive = exports.assertNotFrozen = exports.db = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
exports.db = admin.firestore();
/**
 * Validates that the platform is not in emergency freeze mode.
 */
async function assertNotFrozen() {
    const configSnap = await exports.db.doc("platform/config").get();
    const isFrozen = configSnap.data()?.emergencyFreeze === true;
    if (isFrozen) {
        throw new functions.https.HttpsError("failed-precondition", "The platform is currently in Emergency Freeze mode. Operations are suspended.");
    }
}
exports.assertNotFrozen = assertNotFrozen;
/**
 * Validates that a user account is not disabled.
 */
async function assertUserActive(uid) {
    const userSnap = await exports.db.doc(`users/${uid}`).get();
    if (userSnap.exists && userSnap.data()?.isDisabled === true) {
        throw new functions.https.HttpsError("permission-denied", "This account has been disabled by an administrator.");
    }
}
exports.assertUserActive = assertUserActive;
/**
 * Validates that a barber account is not disabled.
 */
async function assertBarberActive(uid) {
    const barberSnap = await exports.db.doc(`barber_applications/${uid}`).get();
    if (barberSnap.exists && barberSnap.data()?.accountStatus === "disabled") {
        throw new functions.https.HttpsError("permission-denied", "This barber account is currently disabled.");
    }
}
exports.assertBarberActive = assertBarberActive;
/**
 * Checks if the caller is an administrator.
 */
async function isAdmin(uid) {
    const adminSnap = await exports.db.doc(`admins/${uid}`).get();
    return adminSnap.exists;
}
exports.isAdmin = isAdmin;
//# sourceMappingURL=shared.js.map