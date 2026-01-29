import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

export const db = admin.firestore();

/**
 * Validates that the platform is not in emergency freeze mode.
 */
export async function assertNotFrozen() {
    const configSnap = await db.doc("platform/config").get();
    const isFrozen = configSnap.data()?.emergencyFreeze === true;
    if (isFrozen) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "The platform is currently in Emergency Freeze mode. Operations are suspended."
        );
    }
}

/**
 * Validates that a user account is not disabled.
 */
export async function assertUserActive(uid: string) {
    const userSnap = await db.doc(`users/${uid}`).get();
    if (userSnap.exists && userSnap.data()?.isDisabled === true) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "This account has been disabled by an administrator."
        );
    }
}

/**
 * Validates that a barber account is not disabled.
 */
export async function assertBarberActive(uid: string) {
    const barberSnap = await db.doc(`barber_applications/${uid}`).get();
    if (barberSnap.exists && barberSnap.data()?.accountStatus === "disabled") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "This barber account is currently disabled."
        );
    }
}

/**
 * Checks if the caller is an administrator.
 */
export async function isAdmin(uid: string) {
    const adminSnap = await db.doc(`admins/${uid}`).get();
    return adminSnap.exists;
}
