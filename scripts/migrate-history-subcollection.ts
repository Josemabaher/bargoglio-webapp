
export { };
const { initializeApp, getApps } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, setDoc, getDoc, Timestamp } = require("firebase/firestore");
const dotenv = require('dotenv');
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

// Cache for events to avoid repeated reads
const eventCache = new Map();

async function getEventDetails(eventId: any) {
    if (!eventId) return { name: "Evento Desconocido", date: null };
    if (eventCache.has(eventId)) return eventCache.get(eventId);

    try {
        const evDoc = await getDoc(doc(db, "events", eventId));
        if (evDoc.exists()) {
            const d = evDoc.data();
            const details = {
                name: d.name || d.title || "Evento s/t",
                date: d.date // timestamps or string? usually string ISO or timestamp
            };
            eventCache.set(eventId, details);
            return details;
        }
    } catch (e) {
        console.warn("Error fetching event", eventId);
    }
    return { name: "Evento id:" + eventId, date: null };
}

async function migrateHistory() {
    console.log("🚀 Starting History Migration to Subcollections...");

    // 1. Fetch ALL Reservations
    const reservationsRef = collection(db, "reservations");
    const resSnap = await getDocs(reservationsRef);
    console.log(`Found ${resSnap.size} reservations to process.`);

    let count = 0;
    let errors = 0;

    for (const docSnap of resSnap.docs) {
        const r = docSnap.data();
        const uid = r.userId;
        const resId = docSnap.id;

        if (!uid || uid === 'manual-booking' || uid === 'guest_unknown') {
            continue;
        }

        try {
            // Prepare Visit Data
            let eventName = r.eventName;
            let eventDate = null; // We might need this for sorting if we want to sort by Event Date instead of CreatedAt

            // If missing name, fetch from event
            if (!eventName || !r.eventDate) {
                const details = await getEventDetails(r.eventId);
                if (!eventName) eventName = details.name;
                eventDate = details.date;
            }

            const amount = Number(r.totalAmount) || Number(r.amount) || 0;

            // Construct payload
            const visitData = {
                reservationId: resId, // Link back
                eventId: r.eventId || null,
                eventName: eventName || "Evento Desconocido",
                date: eventDate || "N/A", // Event date string
                amount: amount,
                seats: r.seatIds || [],
                createdAt: r.createdAt || Timestamp.now(), // Keep original timestamp for sorting
                paymentId: r.paymentId || null
            };

            // Write to Subcollection: users/{uid}/visits/{resId}
            // Using setDoc to be idempotent
            const visitRef = doc(db, "users", uid, "visits", resId);
            await setDoc(visitRef, visitData);

            process.stdout.write(".");
            count++;
        } catch (err) {
            console.error(`\nFailed to migrate reservation ${resId}:`, err);
            errors++;
        }
    }

    console.log(`\n✅ Migration Complete.`);
    console.log(`Processed: ${count}`);
    console.log(`Errors: ${errors}`);
}

migrateHistory().catch(console.error);
