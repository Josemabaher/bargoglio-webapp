/**
 * Seed Test Show with Specific Reservations
 * Creates exactly 1 show with the user-specified reservations
 */

import { db } from '@/src/lib/firebase/config';
import { collection, doc, setDoc, Timestamp, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';

// ALL seat data from useSeats hook
const ALL_SEATS = [
    // ZONA 1 ($5000)
    { id: "Z1-1-1", tableId: "Z1-1", tableNumber: 2, x: 30.6, y: 35.33, label: "Zona 1", price: 5000 },
    { id: "Z1-1-2", tableId: "Z1-1", tableNumber: 2, x: 36.87, y: 35.59, label: "Zona 1", price: 5000 },
    { id: "Z1-1-3", tableId: "Z1-1", tableNumber: 3, x: 40.37, y: 35.59, label: "Zona 1", price: 5000 },
    { id: "Z1-1-4", tableId: "Z1-1", tableNumber: 3, x: 46.46, y: 35.59, label: "Zona 1", price: 5000 },
    { id: "Z1-2-1", tableId: "Z1-2", tableNumber: 10, x: 54.53, y: 31.23, label: "Zona 1", price: 5000 },
    { id: "Z1-2-2", tableId: "Z1-2", tableNumber: 10, x: 54.61, y: 22.15, label: "Zona 1", price: 5000 },
    { id: "Z1-2-3", tableId: "Z1-2", tableNumber: 5, x: 46.55, y: 42.12, label: "Zona 1", price: 5000 },
    { id: "Z1-2-4", tableId: "Z1-2", tableNumber: 19, x: 60.44, y: 31.11, label: "Zona 2", price: 4000 },
    { id: "Z1-3-1", tableId: "Z1-3", tableNumber: 7, x: 40.37, y: 48.84, label: "Zona 1", price: 5000 },
    { id: "Z1-3-2", tableId: "Z1-3", tableNumber: 7, x: 46.6, y: 48.9, label: "Zona 1", price: 5000 },
    { id: "Z1-3-3", tableId: "Z1-3", tableNumber: 9, x: 40.28, y: 55.17, label: "Zona 1", price: 5000 },
    { id: "Z1-3-4", tableId: "Z1-3", tableNumber: 9, x: 46.55, y: 55.17, label: "Zona 1", price: 5000 },
    { id: "Z1-4-1", tableId: "Z1-4", tableNumber: 11, x: 55.15, y: 47.04, label: "Zona 1", price: 5000 },
    { id: "Z1-4-2", tableId: "Z1-4", tableNumber: 22, x: 63.84, y: 46.6, label: "Zona 2", price: 4000 },
    { id: "Z1-4-3", tableId: "Z1-4", tableNumber: 11, x: 52.37, y: 50.74, label: "Zona 1", price: 5000 },
    { id: "Z1-4-4", tableId: "Z1-4", tableNumber: 22, x: 60.44, y: 50.82, label: "Zona 2", price: 4000 },
    { id: "Z1-5-1", tableId: "Z1-5", tableNumber: 4, x: 30.69, y: 42.12, label: "Zona 1", price: 5000 },
    { id: "Z1-5-2", tableId: "Z1-5", tableNumber: 5, x: 40.37, y: 42.12, label: "Zona 1", price: 5000 },
    { id: "Z1-5-3", tableId: "Z1-5", tableNumber: 8, x: 36.87, y: 55.3, label: "Zona 1", price: 5000 },
    { id: "Z1-5-4", tableId: "Z1-5", tableNumber: 6, x: 36.96, y: 48.64, label: "Zona 1", price: 5000 },
    { id: "Z1-6-1", tableId: "Z1-6", tableNumber: 4, x: 36.96, y: 42.12, label: "Zona 1", price: 5000 },
    { id: "Z1-6-2", tableId: "Z1-6", tableNumber: 6, x: 30.6, y: 48.39, label: "Zona 1", price: 5000 },
    { id: "Z1-6-3", tableId: "Z1-6", tableNumber: 8, x: 30.69, y: 55.43, label: "Zona 1", price: 5000 },
    { id: "Z1-7-1", tableId: "Z1-7", tableNumber: 1, x: 23.34, y: 35.84, label: "Zona 1", price: 5000 },
    { id: "Z1-7-2", tableId: "Z1-7", tableNumber: 1, x: 23.34, y: 27.14, label: "Zona 1", price: 5000 },

    // ZONA 2 ($4000)
    { id: "Z2-1-1", tableId: "Z2-1", tableNumber: 14, x: 15.73, y: 44.16, label: "Zona 2", price: 4000 },
    { id: "Z2-1-2", tableId: "Z2-1", tableNumber: 14, x: 15.64, y: 50.82, label: "Zona 2", price: 4000 },
    { id: "Z2-2-1", tableId: "Z2-2", tableNumber: 19, x: 60.35, y: 22.15, label: "Zona 2", price: 4000 },
    { id: "Z2-2-2", tableId: "Z2-2", tableNumber: 20, x: 66.26, y: 31.11, label: "Zona 2", price: 4000 },
    { id: "Z2-3-1", tableId: "Z2-3", tableNumber: 23, x: 71.28, y: 41.86, label: "Zona 2", price: 4000 },
    { id: "Z2-3-2", tableId: "Z2-3", tableNumber: 23, x: 71.19, y: 50.69, label: "Zona 2", price: 4000 },
    { id: "Z2-4-1", tableId: "Z2-4", tableNumber: 16, x: 46.37, y: 72.45, label: "Zona 2", price: 4000 },
    { id: "Z2-4-2", tableId: "Z2-4", tableNumber: 18, x: 46.55, y: 78.98, label: "Zona 2", price: 4000 },
    { id: "Z2-5-1", tableId: "Z2-5", tableNumber: 20, x: 66.35, y: 22.27, label: "Zona 2", price: 4000 },
    { id: "Z2-5-2", tableId: "Z2-5", tableNumber: 14, x: 19.94, y: 50.63, label: "Zona 2", price: 4000 },
    { id: "Z2-6-1", tableId: "Z2-6", tableNumber: 22, x: 60.8, y: 41.99, label: "Zona 2", price: 4000 },
    { id: "Z2-6-2", tableId: "Z2-6", tableNumber: 16, x: 40.46, y: 72.33, label: "Zona 2", price: 4000 },
    { id: "Z2-6-3", tableId: "Z2-6", tableNumber: 18, x: 40.46, y: 78.85, label: "Zona 2", price: 4000 },
    { id: "Z2-7-1", tableId: "Z2-7", tableNumber: 13, x: 17.88, y: 27.01, label: "Zona 2", price: 4000 },
    { id: "Z2-7-2", tableId: "Z2-7", tableNumber: 13, x: 17.79, y: 35.84, label: "Zona 2", price: 4000 },
    { id: "Z2-7-3", tableId: "Z2-7", tableNumber: 12, x: 11.51, y: 27.27, label: "Zona 2", price: 4000 },
    { id: "Z2-7-4", tableId: "Z2-7", tableNumber: 12, x: 11.6, y: 35.97, label: "Zona 2", price: 4000 },
    { id: "Z2-8-1", tableId: "Z2-8", tableNumber: 17, x: 36.87, y: 78.85, label: "Zona 2", price: 4000 },
    { id: "Z2-8-2", tableId: "Z2-8", tableNumber: 17, x: 30.69, y: 79.11, label: "Zona 2", price: 4000 },
    { id: "Z2-8-3", tableId: "Z2-8", tableNumber: 15, x: 36.78, y: 72.07, label: "Zona 2", price: 4000 },
    { id: "Z2-9-1", tableId: "Z2-9", tableNumber: 21, x: 72, y: 22.53, label: "Zona 2", price: 4000 },
    { id: "Z2-9-2", tableId: "Z2-9", tableNumber: 21, x: 72.09, y: 31.11, label: "Zona 2", price: 4000 },
    { id: "Z2-9-3", tableId: "Z2-9", tableNumber: 15, x: 30.69, y: 72.33, label: "Zona 2", price: 4000 },

    // ZONA 3 ($3000)
    { id: "Z3-1-1", tableId: "Z3-1", tableNumber: 25, x: 5.42, y: 47.75, label: "Zona 3", price: 3000 },
    { id: "Z3-1-2", tableId: "Z3-1", tableNumber: 25, x: 8.56, y: 43.27, label: "Zona 3", price: 3000 },
    { id: "Z3-2-1", tableId: "Z3-2", tableNumber: 27, x: 46.37, y: 85.64, label: "Zona 3", price: 3000 },
    { id: "Z3-2-2", tableId: "Z3-2", tableNumber: 29, x: 40.37, y: 92.04, label: "Zona 3", price: 3000 },
    { id: "Z3-3-1", tableId: "Z3-3", tableNumber: 27, x: 40.46, y: 85.51, label: "Zona 3", price: 3000 },
    { id: "Z3-3-2", tableId: "Z3-3", tableNumber: 29, x: 46.46, y: 92.17, label: "Zona 3", price: 3000 },
    { id: "Z3-4-1", tableId: "Z3-4", tableNumber: 24, x: 5.69, y: 27.27, label: "Zona 3", price: 3000 },
    { id: "Z3-4-2", tableId: "Z3-4", tableNumber: 24, x: 5.78, y: 35.71, label: "Zona 3", price: 3000 },
    { id: "Z3-5-1", tableId: "Z3-5", tableNumber: 33, x: 95.3, y: 22.4, label: "Zona 3", price: 3000 },
    { id: "Z3-5-2", tableId: "Z3-5", tableNumber: 31, x: 83.74, y: 22.27, label: "Zona 3", price: 3000 },
    { id: "Z3-5-3", tableId: "Z3-5", tableNumber: 30, x: 77.91, y: 31.11, label: "Zona 3", price: 3000 },
    { id: "Z3-5-4", tableId: "Z3-5", tableNumber: 30, x: 77.82, y: 22.4, label: "Zona 3", price: 3000 },
    { id: "Z3-6-1", tableId: "Z3-6", tableNumber: 28, x: 36.87, y: 91.91, label: "Zona 3", price: 3000 },
    { id: "Z3-6-2", tableId: "Z3-6", tableNumber: 32, x: 89.47, y: 22.27, label: "Zona 3", price: 3000 },
    { id: "Z3-6-3", tableId: "Z3-6", tableNumber: 31, x: 83.74, y: 30.98, label: "Zona 3", price: 3000 },
    { id: "Z3-7-1", tableId: "Z3-7", tableNumber: 28, x: 30.69, y: 91.91, label: "Zona 3", price: 3000 },
    { id: "Z3-7-2", tableId: "Z3-7", tableNumber: 26, x: 30.6, y: 85.64, label: "Zona 3", price: 3000 },
    { id: "Z3-7-3", tableId: "Z3-7", tableNumber: 26, x: 36.87, y: 85.64, label: "Zona 3", price: 3000 },
    { id: "Z3-8-1", tableId: "Z3-8", tableNumber: 33, x: 95.39, y: 30.85, label: "Zona 3", price: 3000 },
    { id: "Z3-8-2", tableId: "Z3-8", tableNumber: 32, x: 89.56, y: 31.11, label: "Zona 3", price: 3000 },

    // ZONA 4 ($2000)
    { id: "Z4-1-1", tableId: "Z4-1", tableNumber: 35, x: 56.5, y: 9.22, label: "Zona 4", price: 2000 },
    { id: "Z4-1-2", tableId: "Z4-1", tableNumber: 34, x: 7.57, y: 10.62, label: "Zona 4", price: 2000 },
    { id: "Z4-1-3", tableId: "Z4-1", tableNumber: 34, x: 11.87, y: 10.62, label: "Zona 4", price: 2000 },
    { id: "Z4-2-1", tableId: "Z4-2", tableNumber: 37, x: 82.75, y: 8.96, label: "Zona 4", price: 2000 },
    { id: "Z4-2-2", tableId: "Z4-2", tableNumber: 36, x: 72.54, y: 9.22, label: "Zona 4", price: 2000 },
    { id: "Z4-2-3", tableId: "Z4-2", tableNumber: 35, x: 62.5, y: 8.96, label: "Zona 4", price: 2000 },
    { id: "Z4-3-1", tableId: "Z4-3", tableNumber: 34, x: 7.57, y: 16.9, label: "Zona 4", price: 2000 },
    { id: "Z4-3-2", tableId: "Z4-3", tableNumber: 37, x: 76.93, y: 8.96, label: "Zona 4", price: 2000 },
    { id: "Z4-3-3", tableId: "Z4-3", tableNumber: 36, x: 66.71, y: 9.22, label: "Zona 4", price: 2000 },
];

// Get seats by table number
function getSeatsByTable(tableNumber: number, count: number): string[] {
    const tableSeats = ALL_SEATS.filter(s => s.tableNumber === tableNumber);
    return tableSeats.slice(0, count).map(s => s.id);
}

// Specific reservations as requested by user
// PAGOS APROBADOS (OCCUPIED) - 20 lugares total
const CONFIRMED_RESERVATIONS = [
    { name: "Juan Pérez", email: "juan.perez@example.com", tables: [2], seatCount: 2 },
    { name: "Martín Demichelis", email: "martin.demichelis@example.com", tables: [3, 5, 7], seatCount: 6 },
    { name: "Marcelo Gallardo", email: "marcelo.gallardo@example.com", tables: [12, 13], seatCount: 4 },
    { name: "Indio Solari", email: "indio.solari@example.com", tables: [35], seatCount: 1 },
    { name: "Rosa Luxemburgo", email: "rosa.luxemburgo@example.com", tables: [23], seatCount: 1 },
    { name: "Juan Fernando Quintero", email: "juanfer.quintero@example.com", tables: [34], seatCount: 3 },
    { name: "Enzo Francescoli", email: "enzo.francescoli@example.com", tables: [14], seatCount: 3 },
];

// RESERVAS PENDIENTES (RESERVED) - 8 lugares total
const PENDING_RESERVATIONS = [
    { name: "Lionel Messi", email: "lionel.messi@example.com", tables: [22], seatCount: 2 },
    { name: "Jorge Luis Borges", email: "jorge.borges@example.com", tables: [15], seatCount: 2 },
    { name: "Beatriz Sarlo", email: "beatriz.sarlo@example.com", tables: [26], seatCount: 2 },
    { name: "Helena de Troya", email: "helena.troya@example.com", tables: [28], seatCount: 2 },
];

export async function seedTestShow(): Promise<{ success: boolean; message: string }> {
    try {
        // First, delete ALL existing events and reservations
        const eventsRef = collection(db, 'events');
        const existingEvents = await getDocs(eventsRef);

        for (const eventDoc of existingEvents.docs) {
            // Delete all seats subcollection
            const seatsRef = collection(db, 'events', eventDoc.id, 'seats');
            const seats = await getDocs(seatsRef);
            for (const seatDoc of seats.docs) {
                await deleteDoc(seatDoc.ref);
            }
            // Delete the event
            await deleteDoc(eventDoc.ref);
        }

        // Delete all reservations
        const reservationsRef = collection(db, 'reservations');
        const existingReservations = await getDocs(reservationsRef);
        for (const resDoc of existingReservations.docs) {
            await deleteDoc(resDoc.ref);
        }

        console.log("✓ Cleared all existing data");

        // Create the single test show
        const showId = 'test-show-2025';
        const showRef = doc(db, 'events', showId);
        await setDoc(showRef, {
            id: showId,
            name: "Show de Prueba - Datos Controlados",
            date: "2025-03-01",
            time: "22:00",
            description: "Show de prueba con reservas específicas para verificar la funcionalidad",
            isActive: true,
            createdAt: Timestamp.now(),
        });

        console.log("✓ Created test show");

        // Track which seats are occupied/reserved
        const occupiedSeatIds: string[] = [];
        const reservedSeatIds: string[] = [];

        // Process confirmed reservations (occupied seats)
        for (const reservation of CONFIRMED_RESERVATIONS) {
            const seatIds: string[] = [];
            let remaining = reservation.seatCount;

            for (const tableNum of reservation.tables) {
                const tableSeats = ALL_SEATS.filter(s => s.tableNumber === tableNum);
                const seatsToTake = Math.min(remaining, tableSeats.length);

                for (let i = 0; i < seatsToTake; i++) {
                    if (!occupiedSeatIds.includes(tableSeats[i].id) && !reservedSeatIds.includes(tableSeats[i].id)) {
                        seatIds.push(tableSeats[i].id);
                        occupiedSeatIds.push(tableSeats[i].id);
                        remaining--;
                    }
                }
            }

            // Create reservation document
            const resId = `res-${reservation.email.split('@')[0]}`;
            await setDoc(doc(db, 'reservations', resId), {
                id: resId,
                eventId: showId,
                seatIds: seatIds,
                userName: reservation.name,
                userEmail: reservation.email,
                status: 'confirmed',
                checkedIn: false,
                createdAt: Timestamp.now(),
            });

            console.log(`✓ Created reservation for ${reservation.name}: ${seatIds.length} seats`);
        }

        // Process pending reservations (reserved seats)
        for (const reservation of PENDING_RESERVATIONS) {
            const seatIds: string[] = [];
            let remaining = reservation.seatCount;

            for (const tableNum of reservation.tables) {
                const tableSeats = ALL_SEATS.filter(s => s.tableNumber === tableNum);
                const seatsToTake = Math.min(remaining, tableSeats.length);

                for (let i = 0; i < seatsToTake; i++) {
                    if (!occupiedSeatIds.includes(tableSeats[i].id) && !reservedSeatIds.includes(tableSeats[i].id)) {
                        seatIds.push(tableSeats[i].id);
                        reservedSeatIds.push(tableSeats[i].id);
                        remaining--;
                    }
                }
            }

            // Create reservation document
            const resId = `res-${reservation.email.split('@')[0]}`;
            await setDoc(doc(db, 'reservations', resId), {
                id: resId,
                eventId: showId,
                seatIds: seatIds,
                userName: reservation.name,
                userEmail: reservation.email,
                status: 'pending',
                checkedIn: false,
                createdAt: Timestamp.now(),
            });

            console.log(`✓ Created pending reservation for ${reservation.name}: ${seatIds.length} seats`);
        }

        // Now create ALL seats with correct statuses
        const seatsCollection = collection(db, 'events', showId, 'seats');
        const batch = writeBatch(db);

        for (const seat of ALL_SEATS) {
            let status: 'available' | 'occupied' | 'reserved' = 'available';

            if (occupiedSeatIds.includes(seat.id)) {
                status = 'occupied';
            } else if (reservedSeatIds.includes(seat.id)) {
                status = 'reserved';
            }

            const seatDoc = doc(seatsCollection, seat.id);
            batch.set(seatDoc, {
                ...seat,
                status,
            });
        }

        await batch.commit();

        console.log(`✓ Created ${ALL_SEATS.length} seats`);
        console.log(`  - Occupied: ${occupiedSeatIds.length}`);
        console.log(`  - Reserved: ${reservedSeatIds.length}`);
        console.log(`  - Available: ${ALL_SEATS.length - occupiedSeatIds.length - reservedSeatIds.length}`);

        return {
            success: true,
            message: `Show creado con éxito:\n- ${occupiedSeatIds.length} lugares ocupados (${CONFIRMED_RESERVATIONS.length} reservas confirmadas)\n- ${reservedSeatIds.length} lugares reservados (${PENDING_RESERVATIONS.length} reservas pendientes)\n- ${ALL_SEATS.length - occupiedSeatIds.length - reservedSeatIds.length} lugares disponibles`,
        };
    } catch (error) {
        console.error("Error seeding test show:", error);
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
