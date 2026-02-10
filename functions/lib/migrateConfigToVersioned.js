"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateConfigToVersioned = void 0;
const admin = require("firebase-admin");
const shared_1 = require("./shared");
async function migrateConfigToVersioned() {
    console.log("🔄 Starting config migration to versioned system...");
    // Check if already migrated
    const versionsSnapshot = await shared_1.db.collection("platform/config/versions").limit(1).get();
    if (!versionsSnapshot.empty) {
        console.log("⚠️  Migration already completed. Version history exists.");
        console.log("   If you need to re-migrate, manually delete platform/config/versions subcollection first.");
        return;
    }
    // Fetch current config
    const configRef = shared_1.db.doc("platform/config");
    const configSnap = await configRef.get();
    // Define defaults
    const defaultConfig = {
        platformFeePercent: 10,
        refundPresets: [100, 90, 80, 50, 0],
        allowCustomRefundPercentage: false,
        maxSingleRefundAmount: 1000,
        largeRefundThreshold: 700,
        emergencyFreeze: false,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "SYSTEM"
    };
    if (!configSnap.exists) {
        console.log("❌ No platform/config document found. Creating default config...");
        await configRef.set(defaultConfig);
        console.log("✅ Created default config at platform/config");
    }
    else {
        console.log("⚠️  Existing config found. Merging with defaults to ensure schema compliance...");
        const existingData = configSnap.data();
        // Merge missing keys
        const mergedConfig = { ...defaultConfig, ...existingData };
        // Update Firestore with merged data to ensure it has all fields
        await configRef.set(mergedConfig);
        console.log("✅ Updated platform/config with merged schema.");
    }
    // Re-fetch to be sure
    const currentConfigSnap = await configRef.get();
    const currentConfig = currentConfigSnap.data();
    console.log("📋 Current config:", JSON.stringify(currentConfig, null, 2));
    // Create v0001
    const versionData = {
        versionId: "v0001",
        createdAt: admin.firestore.Timestamp.now(),
        createdByAdminId: "SYSTEM",
        createdByAdminEmail: "system@migration",
        changeReason: "Initial version created from migration to versioned config system",
        configSnapshot: currentConfig,
        previousVersionId: null,
        isRollback: false
    };
    const versionRef = shared_1.db.doc("platform/config/versions/v0001");
    await versionRef.set(versionData);
    console.log("✅ Created version v0001 at platform/config/versions/v0001");
    // Log migration
    const logRef = shared_1.db.collection("admin_logs").doc();
    await logRef.set({
        adminId: "SYSTEM",
        adminEmail: "system@migration",
        action: "CONFIG_MIGRATION",
        targetId: "v0001",
        reason: "Migrated to versioned config system",
        timestamp: admin.firestore.Timestamp.now(),
        severity: "HIGH",
        metadata: {
            versionId: "v0001",
            migratedAt: admin.firestore.Timestamp.now()
        }
    });
    console.log("✅ Migration logged to admin_logs");
    console.log("🎉 Migration complete! Config versioning system is now active.");
    console.log("   - Active config: platform/config");
    console.log("   - Version history: platform/config_versions/v0001");
    console.log("   - All future changes will be versioned automatically.");
}
exports.migrateConfigToVersioned = migrateConfigToVersioned;
// Run migration
if (require.main === module) {
    // Initialize Firebase Admin if not already initialized
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    migrateConfigToVersioned()
        .then(() => {
        console.log("✅ Migration script completed successfully");
        process.exit(0);
    })
        .catch((error) => {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateConfigToVersioned.js.map