import { useState, useEffect } from 'react';
import { Seat } from '@/src/types';
import { db } from '@/src/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { INITIAL_SEATS } from '@/src/lib/data/seats';

export function useSeats(eventId: string | null) {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If no eventId, just return initial seats (preview mode)
        if (!eventId) {
            setSeats(INITIAL_SEATS as Seat[]);
            return;
        }

        setLoading(true);

        // Listener for real-time updates
        const seatsRef = collection(db, 'events', eventId, 'seats');

        const unsubscribe = onSnapshot(seatsRef, (snapshot) => {
            if (snapshot.empty) {
                // Default to standard layout if no specific seats found for event
                setSeats(INITIAL_SEATS as Seat[]);
                setLoading(false);
                return;
            }

            const activeSeats: Seat[] = [];
            snapshot.forEach((doc) => {
                activeSeats.push({ id: doc.id, ...doc.data() } as Seat);
            });

            // If we have custom seats in DB, we use them.
            // BUT currently we likely want to MERGE availability with the standard layout?
            // Actually, the previous logic was: "If empty, utilize fallback".
            // If we save seats to DB, we save ALL of them.
            // So replacing is correct.

            setSeats(activeSeats);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching seats:", err);
            setError("Error de conexión con la base de datos.");
            setLoading(false);
            // Fallback on error
            setSeats(INITIAL_SEATS as Seat[]);
        });

        return () => unsubscribe();
    }, [eventId]);

    return { seats, loading, error };
}
