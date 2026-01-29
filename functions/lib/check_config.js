"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Initialize with default credentials
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
async function checkConfig() {
    console.log('--- Checking Firestore platform/config ---');
    try {
        const doc = await db.doc('platform/config').get();
        if (doc.exists) {
            console.log('Document FOUND!');
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        }
        else {
            console.log('Document NOT FOUND at path: platform/config');
        }
    }
    catch (err) {
        console.error('Error reading document:', err);
    }
}
checkConfig();
//# sourceMappingURL=check_config.js.map