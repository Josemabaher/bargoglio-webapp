
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
    console.error("Please provide an email as valid argument. Example: npx ts-node scripts/promote-admin.ts user@example.com");
    process.exit(1);
}

async function promoteUser() {
    console.log(`Searching for user with ID matching email logic is tricky without Auth SDK, asking mainly to copy UID manually or use a lookup if indices exist.`);
    console.log("Actually, users collection is indexed by UID. We need to query by email.");

    // Since we don't have email index guaranteed, let's scan or ask for UID.
    // Simplifying: Let's assume the user knows their UID or we scan all (small db).

    // Better verification: we ran check-users.ts and saw UIDs.
    // Let's iterate all users to find email match.

    const { collection, getDocs } = require("firebase/firestore");
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    let found = false;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.email === TARGET_EMAIL) {
            console.log(`Found user ${data.nombre} (${docSnap.id}). Promoting to Admin...`);
            await updateDoc(doc(db, "users", docSnap.id), {
                role: "admin"
            });
            console.log("Success! Role updated to 'admin'.");
            found = true;
            break;
        }
    }

    if (!found) {
        console.error("User not found via email scan.");
    }
}

promoteUser();
