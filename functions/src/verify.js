const admin = require('firebase-admin');

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
            console.log('STATUS: VERIFIED');
            console.log('DATA:', JSON.stringify(doc.data()));
        } else {
            console.log('STATUS: NOT_FOUND');
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    }
    process.exit(0);
}

checkConfig();
