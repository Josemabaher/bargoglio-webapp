
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function checkUsers() {
    console.log("Checking users in Firestore...");
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        console.log(`Found ${snapshot.size} users.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}, Name: ${data.nombre} ${data.apellido}, Role: ${data.role}`);
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

checkUsers();
