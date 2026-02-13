import { NextResponse } from 'next/server';
import { db } from '@/src/lib/firebase/config';
import { collection, getDocs, doc, writeBatch, query, where } from 'firebase/firestore';
import { INITIAL_SEATS } from '@/src/lib/data/seats';

// Migration script to update seats for existing events
export async function GET() {
    try {
        console.log("Starting seat migration...");

        // 1. Get all events that use zones
        const eventsRef = collection(db, 'events');
        // We might want to filter, but easier to get all and check pricingType in memory or query
        const q = query(eventsRef, where('pricingType', '==', 'zones'));
        const eventsSnapshot = await getDocs(q);

        const results = [];
        const totalEvents = eventsSnapshot.size;
        console.log(`Found ${totalEvents} zone events to migrate.`);

        // 2. Iterate through events
        for (const eventDoc of eventsSnapshot.docs) {
            const eventId = eventDoc.id;
            const eventData = eventDoc.data();
            console.log(`Processing event: ${eventData.name || eventData.title} (${eventId})`);

            // 3. Get existing seats
            const seatsRef = collection(db, 'events', eventId, 'seats');
            const seatsSnapshot = await getDocs(seatsRef);

            // 4. Preserve status of existing seats
            const seatStatusMap = new Map<string, string>();
            seatsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'occupied' || data.status === 'reserved') {
                    seatStatusMap.set(doc.id, data.status);
                }
            });

            // 5. Batch writes (Delete old, Create new)
            // Firestore batch limit is 500 ops.
            // We have ~70 seats to delete + ~70 to add = ~140 ops per event.
            // One batch per event is safe.
            const batch = writeBatch(db);

            // Delete existing
            seatsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Add new seats from INITIAL_SEATS
            INITIAL_SEATS.forEach(seat => {
                if (!seat.id) return;

                // Check preserved status
                const preservedStatus = seatStatusMap.get(seat.id);
                // If the seat ID exists in the map, use that status. Otherwise default to 'available'.
                const finalStatus = preservedStatus || 'available';

                const newSeatRef = doc(collection(db, 'events', eventId, 'seats'), seat.id);
                batch.set(newSeatRef, {
                    ...seat,
                    status: finalStatus,
                    // Ensure tableNumber is number
                    tableNumber: Number(seat.tableNumber) || 0,
                    price: Number(seat.price) || 0,
                    x: Number(seat.x),
                    y: Number(seat.y)
                });
            });

            await batch.commit();
            results.push({
                eventId,
                name: eventData.name,
                seatsUpdated: INITIAL_SEATS.length,
                preserved: seatStatusMap.size
            });
        }

        return NextResponse.json({
            success: true,
            message: `Migrated ${results.length} events successfully.`,
            details: results
        });

    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
