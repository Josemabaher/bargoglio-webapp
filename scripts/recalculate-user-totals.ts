
export { };
const { initializeApp, getApps } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc, Timestamp, orderBy, query, writeBatch } = require("firebase/firestore");
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

interface UserStats {
    totalSpent: number;
    visitCount: number;
    lastVisit: any;
    points: number;
}

// Map userId -> Stats
const userStatsMap = new Map<string, UserStats>();

async function recalculateTotals() {
    console.log("🚀 Starting User Totals Recalculation...");

    // 1. Fetch ALL Reservations
    // Use simple query without orderBy to assume no index if large, but we can try orderBy desc created to get last visit easy? 
    // Actually, sorting in memory is safer if index missing.
    console.log("Reading reservations...");
    const reservationsRef = collection(db, "reservations");
    const resSnap = await getDocs(reservationsRef);
    console.log(`Found ${resSnap.size} reservations.`);

    // 2. Aggregate Data
    resSnap.forEach((docSnap: any) => {
        const data = docSnap.data();
        const uid = data.userId;

        if (!uid || uid === 'manual-booking') return; // Skip unlinked

        const amount = Number(data.totalAmount) || Number(data.amount) || 0;
        const createdAt = data.createdAt;

        // Init stats if missing
        if (!userStatsMap.has(uid)) {
            userStatsMap.set(uid, {
                totalSpent: 0,
                visitCount: 0,
                lastVisit: null,
                points: 0
            });
        }

        const stats = userStatsMap.get(uid)!;
        stats.totalSpent += amount;
        stats.visitCount += 1;
        stats.points += Math.floor(amount / 1000);

        // Update last visit
        if (createdAt && createdAt instanceof Timestamp) {
            if (!stats.lastVisit || createdAt.toMillis() > stats.lastVisit.toMillis()) {
                stats.lastVisit = createdAt;
            }
        }
    });

    console.log(`Aggregated data for ${userStatsMap.size} unique users.`);

    // 3. Update Users Batch
    // Batch limit is 500 ops
    let batch = writeBatch(db);
    let count = 0;
    let totalUpdated = 0;

    for (const [uid, stats] of userStatsMap.entries()) {
        const userRef = doc(db, "users", uid);

        // We only update the stats fields
        batch.update(userRef, {
            totalSpent: stats.totalSpent,
            visitCount: stats.visitCount,
            lastVisit: stats.lastVisit || Timestamp.now(), // Fallback if no date found
            // Optional: update points if we want to reset them based on strict history
            // But maybe points were spent? Let's assume we ADD missing points? 
            // Better to just update totalSpent/visitCount as requested. Points might be complex if redemption exists.
            // User asked to fix "Totales" (spending/visits). Let's stick to that to be safe.
            // If points are wildly off we can think about it, but let's just do spending/visits.
            // Actually, the previous implementation plan says: "Updates users/{uid} document with points: increment...".
            // Since this is a REPAIR script, setting it to the calculated total might overwrite manual adjustments or redemptions.
            // Safer to ONLY repair totalSpent and visitCount which are strictly historical.
        });

        count++;
        totalUpdated++;

        if (count >= 400) {
            await batch.commit();
            console.log(`Committed batch of ${count} updates...`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${count} updates.`);
    }

    console.log(`✅ Success! Updated ${totalUpdated} users with recalculated totals.`);
}

recalculateTotals().catch(console.error);
