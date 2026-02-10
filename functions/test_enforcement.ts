/**
 * Phase 4.B Enforcement Test Script
 * Run with: npx ts-node test_enforcement.ts
 */

import * as admin from "firebase-admin";

// Initialize with service account
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "best-cut1"
});

const db = admin.firestore();

async function runTests() {
    console.log("=== PHASE 4.B ENFORCEMENT TESTS ===\n");

    // TEST 1: Direct wallet write (should FAIL)
    console.log("TEST 1: Direct wallet write");
    try {
        await db.doc("wallets/test-user-123").set({ balance: 999999 });
        console.log("❌ FAILED - Write succeeded (should have been blocked by rules)\n");
    } catch (error: any) {
        console.log("✅ PASSED - Error:", error.message, "\n");
    }

    // TEST 2: Direct transaction write (should FAIL)
    console.log("TEST 2: Direct transaction write");
    try {
        await db.collection("transactions").add({ amount: 100, userId: "test" });
        console.log("❌ FAILED - Write succeeded (should have been blocked by rules)\n");
    } catch (error: any) {
        console.log("✅ PASSED - Error:", error.message, "\n");
    }

    // TEST 3: Direct admin_logs write (should FAIL)
    console.log("TEST 3: Direct admin_logs write");
    try {
        await db.collection("admin_logs").add({ action: "TEST", adminId: "fake" });
        console.log("❌ FAILED - Write succeeded (should have been blocked by rules)\n");
    } catch (error: any) {
        console.log("✅ PASSED - Error:", error.message, "\n");
    }

    // TEST 4: Read wallet (should PASS for admin SDK)
    console.log("TEST 4: Read wallet (Admin SDK bypass)");
    try {
        const walletSnap = await db.doc("wallets/test-user").get();
        console.log("✅ PASSED - Admin SDK can read wallets\n");
    } catch (error: any) {
        console.log("❌ FAILED - Error:", error.message, "\n");
    }

    console.log("=== END TESTS ===");
}

runTests().then(() => process.exit(0)).catch(console.error);
