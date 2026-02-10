const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

// Firebase configuration from .env.local
const firebaseConfig = {
    apiKey: "AIzaSyD-hp-B_nyC5N8y_qkEXEldJuf1e3OKza8",
    authDomain: "best-cut1.firebaseapp.com",
    projectId: "best-cut1",
    storageBucket: "best-cut1.firebasestorage.app",
    messagingSenderId: "1096421021018",
    appId: "1:1096421021018:web:945475713e8db3849e4f63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugBarbers() {
    console.log("Fetching barber applications...");
    try {
        const colRef = collection(db, "barber_applications");
        const snapshot = await getDocs(colRef);

        console.log("Snapshot size:", snapshot.size);

        if (snapshot.empty) {
            console.log("No barber applications found.");
            process.exit(0);
        }

        console.log(`Found ${snapshot.size} documents.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Status (Legacy): ${data.status}`);
            console.log(`AccountStatus (New): ${data.accountStatus}`);
            // console.log(`Full Data:`, JSON.stringify(data, null, 2)); 
        });
        process.exit(0);
    } catch (error) {
        console.error("Error fetching barbers:", error);
        process.exit(1);
    }
}

debugBarbers();
