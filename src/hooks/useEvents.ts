import { useState, useEffect } from 'react';
import { Event } from '@/src/types';
import { db } from '@/src/lib/firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

export function useEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsRef = collection(db, 'events');
                const eventsSnapshot = await getDocs(eventsRef);

                const fetchedEvents: Event[] = eventsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.name || data.title || 'Sin título',
                        description: data.description || '',
                        flyerUrl: data.flyerUrl || '',
                        flyer_url: data.flyerUrl || '',
                        date: data.date || '',
                        time: data.time || '',
                        zonesPrices: data.zonesPrices || [],
                        precios_por_zona: data.zonesPrices?.map((z: { price: number }) => z.price) || [],
                        isActive: data.isActive !== false,
                        category: data.category || 'show',
                        pricingType: data.pricingType || (data.zonesPrices?.length > 0 ? 'zones' : 'general'),
                        generalPrice: data.generalPrice,
                    };
                });

                const activeEvents = fetchedEvents
                    .filter(e => e.isActive)
                    .sort((a, b) => a.date.localeCompare(b.date));

                setEvents(activeEvents);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("No se pudieron cargar los eventos.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return { events, loading, error };
}
