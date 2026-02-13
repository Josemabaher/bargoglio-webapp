import { NextResponse } from 'next/server';
import { db } from '@/src/lib/firebase/config';
import { collection, getDocs, doc, writeBatch, query, where } from 'firebase/firestore';
import { INITIAL_SEATS } from '@/src/lib/data/seats';

// Helper to determine price based on label and event config
function getPriceForSeat(label: string | undefined, eventData: any): number {
    if (!label) return 0;

    // Check pricing type
    if (eventData.pricingType === 'general') {
        return Number(eventData.generalPrice) || 0;
    }

    if (eventData.pricingType === 'free') {
        return 0;
    }

    if (eventData.pricingType === 'zones' && eventData.zonesPrices) {
        // Find matching zone
        const zoneConfig = eventData.zonesPrices.find((z: any) => z.zone === label);
        if (zoneConfig) return Number(zoneConfig.price) || 0;
    }

    // Fallback if no config matches (legacy data structure support)
    return 0;
}

// Migration script to update seats for existing events
export async function GET() {
    try {
        console.log("Starting seat migration...");

        // 1. Get all events that use zones (or all events to be safe and update map)
        const eventsRef = collection(db, 'events');
        // We migrate ALL events to ensure map is updated everywhere.
        const eventsSnapshot = await getDocs(eventsRef);

        const results = [];
        const totalEvents = eventsSnapshot.size;
        console.log(`Found ${totalEvents} events to migrate.`);

        // 2. Iterate through events
        for (const eventDoc of eventsSnapshot.docs) {
            const eventId = eventDoc.id;
            const eventData = eventDoc.data();
            console.log(`Processing event: ${eventData.name || eventData.title} (${eventId})`);

            // Only migrate if it has a seating capability (pricingType exists)
            if (!eventData.pricingType) {
                console.log(`Skipping event ${eventId} (unknown pricing type)`);
                continue;
            }

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
                const finalStatus = preservedStatus || 'available';

                // Calculate dynamic price
                const finalPrice = getPriceForSeat(seat.label, eventData);

                const newSeatRef = doc(collection(db, 'events', eventId, 'seats'), seat.id);
                batch.set(newSeatRef, {
                    ...seat,
                    status: finalStatus,
                    price: finalPrice,
                    // Ensure numeric types
                    tableNumber: Number(seat.tableNumber) || 0,
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
