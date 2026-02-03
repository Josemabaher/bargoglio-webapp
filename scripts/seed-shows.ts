/**
 * Seed Shows and Reservations
 * Creates 5 shows with controlled reservations (not random)
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

// 5 Shows with dates (2026) and flyer images
export const SEED_SHOWS = [
    {
        id: "show-rock-clasico",
        name: "Rock Clásico - 15 FEB",
        date: "2026-02-15",
        time: "22:00",
        flyerUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&h=800&fit=crop"
    },
    {
        id: "show-tango-night",
        name: "Noche de Tango - 22 FEB",
        date: "2026-02-22",
        time: "21:00",
        flyerUrl: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=800&fit=crop"
    },
    {
        id: "show-jazz-session",
        name: "Jazz Session - 01 MAR",
        date: "2026-03-01",
        time: "20:30",
        flyerUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=800&fit=crop"
    },
    {
        id: "show-folklore",
        name: "Folklore Argentino - 08 MAR",
        date: "2026-03-08",
        time: "21:00",
        flyerUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=800&fit=crop"
    },
    {
        id: "show-tributo-soda",
        name: "Tributo a Soda Stereo - 15 MAR",
        date: "2026-03-15",
        time: "22:30",
        flyerUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=800&fit=crop"
    },
];

// Sample clients with Argentine names
const SAMPLE_CLIENTS = [
    "Juan Pérez", "María García", "Carlos López", "Ana Martínez", "Roberto Fernández",
    "Laura Gómez", "Diego Sánchez", "Valentina Ruiz", "Martín González", "Sofía Rodríguez",
    "Nicolás Díaz", "Camila Hernández", "Facundo Torres", "Lucía Ramírez", "Agustín Flores",
    "Florencia Moreno", "Tomás Romero", "Julieta Acosta", "Matías Benítez", "Micaela Castro",
];

// Define reservations for each show (different configurations)
interface ReservationDef {
    name: string;
    tables: number[];
    seatCount: number;
    status: 'confirmed' | 'pending';
}

const SHOW_RESERVATIONS: Record<string, ReservationDef[]> = {
    "show-rock-clasico": [
        // Confirmed (18 seats)
        { name: "Carlos Santana", tables: [1, 2], seatCount: 4, status: 'confirmed' },
        { name: "Luca Prodan", tables: [5, 7], seatCount: 4, status: 'confirmed' },
        { name: "Pappo Napolitano", tables: [10, 11], seatCount: 4, status: 'confirmed' },
        { name: "Charly García", tables: [14], seatCount: 3, status: 'confirmed' },
        { name: "Luis Alberto Spinetta", tables: [23], seatCount: 2, status: 'confirmed' },
        { name: "Fito Páez", tables: [35], seatCount: 1, status: 'confirmed' },
        // Pending (10 seats)
        { name: "Gustavo Cerati", tables: [22], seatCount: 4, status: 'pending' },
        { name: "León Gieco", tables: [15, 16], seatCount: 4, status: 'pending' },
        { name: "Mercedes Sosa", tables: [26], seatCount: 2, status: 'pending' },
    ],
    "show-tango-night": [
        // Confirmed (22 seats)
        { name: "Carlos Gardel", tables: [1], seatCount: 2, status: 'confirmed' },
        { name: "Astor Piazzolla", tables: [2, 3], seatCount: 4, status: 'confirmed' },
        { name: "Aníbal Troilo", tables: [5, 6, 7], seatCount: 6, status: 'confirmed' },
        { name: "Osvaldo Pugliese", tables: [12, 13], seatCount: 4, status: 'confirmed' },
        { name: "Julio Sosa", tables: [20, 21], seatCount: 4, status: 'confirmed' },
        { name: "Adriana Varela", tables: [34], seatCount: 2, status: 'confirmed' },
        // Pending (6 seats)
        { name: "Roberto Goyeneche", tables: [22], seatCount: 2, status: 'pending' },
        { name: "Edmundo Rivero", tables: [28], seatCount: 2, status: 'pending' },
        { name: "Libertad Lamarque", tables: [33], seatCount: 2, status: 'pending' },
    ],
    "show-jazz-session": [
        // Confirmed (15 seats)
        { name: "Gato Barbieri", tables: [1, 2], seatCount: 4, status: 'confirmed' },
        { name: "Lalo Schifrin", tables: [10, 11], seatCount: 4, status: 'confirmed' },
        { name: "Jorge Navarro", tables: [14], seatCount: 3, status: 'confirmed' },
        { name: "Adrián Iaies", tables: [22], seatCount: 4, status: 'confirmed' },
        // Pending (12 seats)
        { name: "Luis Salinas", tables: [5, 7], seatCount: 4, status: 'pending' },
        { name: "Pablo Ziegler", tables: [15, 16], seatCount: 4, status: 'pending' },
        { name: "Javier Malosetti", tables: [26, 27], seatCount: 4, status: 'pending' },
    ],
    "show-folklore": [
        // Confirmed (25 seats)
        { name: "Atahualpa Yupanqui", tables: [1, 2, 3], seatCount: 6, status: 'confirmed' },
        { name: "Los Chalchaleros", tables: [5, 6, 7], seatCount: 6, status: 'confirmed' },
        { name: "Horacio Guarany", tables: [10, 11], seatCount: 4, status: 'confirmed' },
        { name: "Jorge Cafrune", tables: [12, 13], seatCount: 4, status: 'confirmed' },
        { name: "Los Fronterizos", tables: [20, 21], seatCount: 4, status: 'confirmed' },
        { name: "Soledad Pastorutti", tables: [35], seatCount: 1, status: 'confirmed' },
        // Pending (8 seats)
        { name: "Abel Pintos", tables: [22], seatCount: 4, status: 'pending' },
        { name: "Luciano Pereyra", tables: [28, 29], seatCount: 4, status: 'pending' },
    ],
    "show-tributo-soda": [
        // Confirmed (30 seats) - Almost sold out!
        { name: "Zeta Bosio", tables: [1, 2], seatCount: 4, status: 'confirmed' },
        { name: "Charly Alberti", tables: [3, 4], seatCount: 4, status: 'confirmed' },
        { name: "Richard Coleman", tables: [5, 6, 7], seatCount: 6, status: 'confirmed' },
        { name: "Andrea Álvarez", tables: [10, 11], seatCount: 4, status: 'confirmed' },
        { name: "Tweety González", tables: [12, 13, 14], seatCount: 6, status: 'confirmed' },
        { name: "Flavio Etcheto", tables: [22], seatCount: 4, status: 'confirmed' },
        { name: "Fernando Samalea", tables: [34], seatCount: 2, status: 'confirmed' },
        // Pending (4 seats)
        { name: "Benito Cerati", tables: [35, 36], seatCount: 4, status: 'pending' },
    ],
};

export async function seedShowsAndReservations(): Promise<{ success: boolean; message: string }> {
    try {
        // First, delete ALL existing events and reservations
        const eventsRef = collection(db, 'events');
        const existingEvents = await getDocs(eventsRef);

        for (const eventDoc of existingEvents.docs) {
            const seatsRef = collection(db, 'events', eventDoc.id, 'seats');
            const seats = await getDocs(seatsRef);
            for (const seatDoc of seats.docs) {
                await deleteDoc(seatDoc.ref);
            }
            await deleteDoc(eventDoc.ref);
        }

        const reservationsRef = collection(db, 'reservations');
        const existingReservations = await getDocs(reservationsRef);
        for (const resDoc of existingReservations.docs) {
            await deleteDoc(resDoc.ref);
        }

        console.log("✓ Cleared all existing data");

        let totalShows = 0;
        let totalReservations = 0;

        for (const show of SEED_SHOWS) {
            // Create the event
            const showRef = doc(db, 'events', show.id);
            await setDoc(showRef, {
                ...show,
                description: `Evento: ${show.name}`,
                isActive: true,
                createdAt: Timestamp.now(),
            });

            const reservationDefs = SHOW_RESERVATIONS[show.id] || [];
            const occupiedSeatIds: string[] = [];
            const reservedSeatIds: string[] = [];

            // Process each reservation
            for (const resDef of reservationDefs) {
                const seatIds: string[] = [];
                let remaining = resDef.seatCount;
                const usedIds = [...occupiedSeatIds, ...reservedSeatIds];

                for (const tableNum of resDef.tables) {
                    const tableSeats = ALL_SEATS.filter(s => s.tableNumber === tableNum);
                    for (const seat of tableSeats) {
                        if (remaining > 0 && !usedIds.includes(seat.id) && !seatIds.includes(seat.id)) {
                            seatIds.push(seat.id);
                            remaining--;
                        }
                    }
                }

                if (resDef.status === 'confirmed') {
                    occupiedSeatIds.push(...seatIds);
                } else {
                    reservedSeatIds.push(...seatIds);
                }

                // Create reservation document
                const resId = `res-${show.id}-${resDef.name.toLowerCase().replace(/\s+/g, '-')}`;
                await setDoc(doc(db, 'reservations', resId), {
                    id: resId,
                    eventId: show.id,
                    seatIds: seatIds,
                    userName: resDef.name,
                    userEmail: `${resDef.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                    status: resDef.status,
                    checkedIn: false,
                    createdAt: Timestamp.now(),
                });
                totalReservations++;
            }

            // Create ALL seats with correct statuses
            const seatsCollection = collection(db, 'events', show.id, 'seats');
            const batch = writeBatch(db);

            for (const seat of ALL_SEATS) {
                let status: 'available' | 'occupied' | 'reserved' = 'available';
                if (occupiedSeatIds.includes(seat.id)) status = 'occupied';
                else if (reservedSeatIds.includes(seat.id)) status = 'reserved';

                batch.set(doc(seatsCollection, seat.id), { ...seat, status });
            }

            await batch.commit();
            totalShows++;

            console.log(`✓ ${show.name}: ${occupiedSeatIds.length} ocupados, ${reservedSeatIds.length} reservados`);
        }

        return {
            success: true,
            message: `✅ Creados ${totalShows} shows con ${totalReservations} reservas controladas`,
        };
    } catch (error) {
        console.error("Error seeding shows:", error);
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
