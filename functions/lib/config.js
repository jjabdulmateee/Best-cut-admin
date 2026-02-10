"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigDiff = exports.getConfigHistory = exports.rollbackPlatformConfig = exports.updatePlatformConfig = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const shared_1 = require("./shared");
// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Validates platform config schema and business rules.
 * Throws HttpsError if validation fails.
 */
function validateConfig(config) {
    // Platform Fee Percent: 0-100
    if (config.platformFeePercent !== undefined) {
        if (typeof config.platformFeePercent !== "number" ||
            config.platformFeePercent < 0 ||
            config.platformFeePercent > 100) {
            throw new functions.https.HttpsError("invalid-argument", "platformFeePercent must be a number between 0 and 100");
        }
    }
    // Refund Presets: Array of 0-100
    if (config.refundPresets !== undefined) {
        if (!Array.isArray(config.refundPresets)) {
            throw new functions.https.HttpsError("invalid-argument", "refundPresets must be an array");
        }
        for (const preset of config.refundPresets) {
            if (typeof preset !== "number" || preset < 0 || preset > 100) {
                throw new functions.https.HttpsError("invalid-argument", "All refundPresets must be numbers between 0 and 100");
            }
        }
    }
    // Allow Custom Refund Percentage: Boolean
    if (config.allowCustomRefundPercentage !== undefined) {
        if (typeof config.allowCustomRefundPercentage !== "boolean") {
            throw new functions.https.HttpsError("invalid-argument", "allowCustomRefundPercentage must be a boolean");
        }
    }
    // Max Single Refund Amount: Positive number
    if (config.maxSingleRefundAmount !== undefined) {
        if (typeof config.maxSingleRefundAmount !== "number" ||
            config.maxSingleRefundAmount <= 0) {
            throw new functions.https.HttpsError("invalid-argument", "maxSingleRefundAmount must be a positive number");
        }
    }
    // Large Refund Threshold: Positive, less than max
    if (config.largeRefundThreshold !== undefined) {
        if (typeof config.largeRefundThreshold !== "number" ||
            config.largeRefundThreshold <= 0) {
            throw new functions.https.HttpsError("invalid-argument", "largeRefundThreshold must be a positive number");
        }
    }
    // Cross-field validation: threshold < max
    if (config.largeRefundThreshold !== undefined &&
        config.maxSingleRefundAmount !== undefined) {
        if (config.largeRefundThreshold >= config.maxSingleRefundAmount) {
            throw new functions.https.HttpsError("invalid-argument", "largeRefundThreshold must be less than maxSingleRefundAmount");
        }
    }
    // Emergency Freeze: Boolean
    if (config.emergencyFreeze !== undefined) {
        if (typeof config.emergencyFreeze !== "boolean") {
            throw new functions.https.HttpsError("invalid-argument", "emergencyFreeze must be a boolean");
        }
    }
    // Reject unknown fields
    const allowedFields = [
        "platformFeePercent",
        "refundPresets",
        "allowCustomRefundPercentage",
        "maxSingleRefundAmount",
        "largeRefundThreshold",
        "emergencyFreeze"
    ];
    for (const key of Object.keys(config)) {
        if (!allowedFields.includes(key)) {
            throw new functions.https.HttpsError("invalid-argument", `Unknown config field: ${key}`);
        }
    }
}
/**
 * Generates next version ID (e.g., v0001 -> v0002)
 */
async function generateNextVersionId() {
    const versionsRef = shared_1.db.collection("platform/config/versions");
    const snapshot = await versionsRef.orderBy("createdAt", "desc").limit(1).get();
    if (snapshot.empty) {
        return "v0001";
    }
    const latestVersion = snapshot.docs[0].data();
    const latestNum = parseInt(latestVersion.versionId.substring(1), 10);
    const nextNum = latestNum + 1;
    return `v${nextNum.toString().padStart(4, "0")}`;
}
/**
 * Computes diff between two config objects
 */
function computeDiff(oldConfig, newConfig) {
    const diffs = [];
    const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);
    for (const key of allKeys) {
        // Skip metadata fields
        if (key === "updatedAt" || key === "updatedBy")
            continue;
        const oldValue = oldConfig[key];
        const newValue = newConfig[key];
        if (oldValue === undefined && newValue !== undefined) {
            diffs.push({ field: key, oldValue: null, newValue, changeType: "added" });
        }
        else if (oldValue !== undefined && newValue === undefined) {
            diffs.push({ field: key, oldValue, newValue: null, changeType: "removed" });
        }
        else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            diffs.push({ field: key, oldValue, newValue, changeType: "modified" });
        }
    }
    return diffs;
}
// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================
/**
 * Update Platform Config (Admin Only)
 * Creates new version, validates schema, updates active config
 */
exports.updatePlatformConfig = functions.https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required.");
    }
    const { updates, changeReason } = data;
    // Validate inputs
    if (!updates || typeof updates !== "object") {
        throw new functions.https.HttpsError("invalid-argument", "updates must be an object");
    }
    if (!changeReason || typeof changeReason !== "string" || changeReason.trim().length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "changeReason is required and must be a non-empty string");
    }
    // Validate config schema
    validateConfig(updates);
    // Fetch current config
    const configRef = shared_1.db.doc("platform/config");
    const configSnap = await configRef.get();
    if (!configSnap.exists) {
        throw new functions.https.HttpsError("failed-precondition", "Platform config not initialized. Run migration first.");
    }
    const currentConfig = configSnap.data();
    // Merge updates with current config
    const newConfig = {
        ...currentConfig,
        ...updates,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: context.auth.uid
    };
    // Re-validate merged config (for cross-field validation)
    validateConfig(newConfig);
    // Generate new version ID
    const versionId = await generateNextVersionId();
    // Get admin email
    const adminEmail = context.auth.token.email || "unknown";
    // Get previous version ID
    const previousVersionQuery = await shared_1.db.collection("platform/config/versions")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
    const previousVersionId = previousVersionQuery.empty
        ? null
        : previousVersionQuery.docs[0].data().versionId;
    // Create version document
    const versionData = {
        versionId,
        createdAt: admin.firestore.Timestamp.now(),
        createdByAdminId: context.auth.uid,
        createdByAdminEmail: adminEmail,
        changeReason: changeReason.trim(),
        configSnapshot: newConfig,
        previousVersionId,
        isRollback: false
    };
    // Atomic write: version + config update
    const batch = shared_1.db.batch();
    const versionRef = shared_1.db.doc(`platform/config/versions/${versionId}`);
    batch.set(versionRef, versionData);
    batch.set(configRef, newConfig);
    await batch.commit();
    // Compute diff for audit log
    const diff = computeDiff(currentConfig, newConfig);
    // Log to admin_logs
    const logRef = shared_1.db.collection("admin_logs").doc();
    await logRef.set({
        adminId: context.auth.uid,
        adminEmail,
        action: "CONFIG_UPDATE",
        targetId: versionId,
        reason: changeReason.trim(),
        timestamp: admin.firestore.Timestamp.now(),
        severity: "HIGH",
        metadata: {
            versionId,
            previousVersionId,
            fieldsChanged: diff.map(d => d.field),
            diff
        }
    });
    return {
        success: true,
        versionId,
        message: `Config updated successfully. New version: ${versionId}`
    };
});
/**
 * Rollback Platform Config (Admin Only)
 * Creates NEW version with snapshot from target version
 */
exports.rollbackPlatformConfig = functions.https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required.");
    }
    const { targetVersionId, rollbackReason } = data;
    // Validate inputs
    if (!targetVersionId || typeof targetVersionId !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "targetVersionId is required");
    }
    if (!rollbackReason || typeof rollbackReason !== "string" || rollbackReason.trim().length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "rollbackReason is required and must be a non-empty string");
    }
    // Fetch target version
    const targetVersionRef = shared_1.db.doc(`platform/config/versions/${targetVersionId}`);
    const targetVersionSnap = await targetVersionRef.get();
    if (!targetVersionSnap.exists) {
        throw new functions.https.HttpsError("not-found", `Version ${targetVersionId} not found`);
    }
    const targetVersion = targetVersionSnap.data();
    const targetConfig = targetVersion.configSnapshot;
    // Generate new version ID
    const newVersionId = await generateNextVersionId();
    // Get admin email
    const adminEmail = context.auth.token.email || "unknown";
    // Get current version ID
    const currentVersionQuery = await shared_1.db.collection("platform/config/versions")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
    const currentVersionId = currentVersionQuery.empty
        ? null
        : currentVersionQuery.docs[0].data().versionId;
    // Create rollback version document
    const rollbackVersionData = {
        versionId: newVersionId,
        createdAt: admin.firestore.Timestamp.now(),
        createdByAdminId: context.auth.uid,
        createdByAdminEmail: adminEmail,
        changeReason: `ROLLBACK: ${rollbackReason.trim()}`,
        configSnapshot: {
            ...targetConfig,
            updatedAt: admin.firestore.Timestamp.now(),
            updatedBy: context.auth.uid
        },
        previousVersionId: currentVersionId,
        isRollback: true,
        rollbackFromVersionId: targetVersionId
    };
    // Atomic write: new version + config update
    const batch = shared_1.db.batch();
    const newVersionRef = shared_1.db.doc(`platform/config/versions/${newVersionId}`);
    batch.set(newVersionRef, rollbackVersionData);
    const configRef = shared_1.db.doc("platform/config");
    batch.set(configRef, rollbackVersionData.configSnapshot);
    await batch.commit();
    // Log to admin_logs
    const logRef = shared_1.db.collection("admin_logs").doc();
    await logRef.set({
        adminId: context.auth.uid,
        adminEmail,
        action: "CONFIG_ROLLBACK",
        targetId: newVersionId,
        reason: rollbackReason.trim(),
        timestamp: admin.firestore.Timestamp.now(),
        severity: "CRITICAL",
        metadata: {
            newVersionId,
            rolledBackToVersionId: targetVersionId,
            previousVersionId: currentVersionId
        }
    });
    return {
        success: true,
        newVersionId,
        message: `Config rolled back to ${targetVersionId}. New version: ${newVersionId}`
    };
});
/**
 * Get Config History (Admin Only)
 * Returns paginated version history
 */
exports.getConfigHistory = functions.https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required.");
    }
    const { limit = 50, startAfter } = data;
    let query = shared_1.db.collection("platform/config/versions")
        .orderBy("createdAt", "desc")
        .limit(limit);
    if (startAfter) {
        const startAfterDoc = await shared_1.db.doc(`platform/config/versions/${startAfter}`).get();
        if (startAfterDoc.exists) {
            query = query.startAfter(startAfterDoc);
        }
    }
    const snapshot = await query.get();
    const versions = snapshot.docs.map(doc => doc.data());
    return {
        versions,
        hasMore: snapshot.size === limit
    };
});
/**
 * Get Config Diff (Admin Only)
 * Computes field-by-field diff between two versions
 */
exports.getConfigDiff = functions.https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const callerIsAdmin = await (0, shared_1.isAdmin)(context.auth.uid);
    if (!callerIsAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required.");
    }
    const { versionA, versionB } = data;
    if (!versionA || !versionB) {
        throw new functions.https.HttpsError("invalid-argument", "Both versionA and versionB are required");
    }
    // Fetch both versions
    const [versionASnap, versionBSnap] = await Promise.all([
        shared_1.db.doc(`platform/config/versions/${versionA}`).get(),
        shared_1.db.doc(`platform/config/versions/${versionB}`).get()
    ]);
    if (!versionASnap.exists) {
        throw new functions.https.HttpsError("not-found", `Version ${versionA} not found`);
    }
    if (!versionBSnap.exists) {
        throw new functions.https.HttpsError("not-found", `Version ${versionB} not found`);
    }
    const versionAData = versionASnap.data();
    const versionBData = versionBSnap.data();
    const diff = computeDiff(versionAData.configSnapshot, versionBData.configSnapshot);
    return {
        diff,
        versionA: versionAData,
        versionB: versionBData
    };
});
//# sourceMappingURL=config.js.map