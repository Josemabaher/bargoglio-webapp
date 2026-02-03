'use client';

/**
 * Real-time listener hook for sales/reservations
 * Automatically updates Dashboard without page reload
 */

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import { Reservation } from '@/src/types';

interface UseSalesListenerOptions {
    eventId?: string;
    status?: 'pending' | 'confirmed' | 'cancelled';
    limit?: number;
}

/**
 * Hook to listen for real-time sales updates
 * @param options - Filter options for the listener
 * @returns Live array of reservations
 */
export function useSalesListener(options: UseSalesListenerOptions = {}): {
    sales: Reservation[];
    loading: boolean;
    error: Error | null;
} {
    const [sales, setSales] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const constraints = [];

        if (options.eventId) {
            constraints.push(where('eventId', '==', options.eventId));
        }

        if (options.status) {
            constraints.push(where('status', '==', options.status));
        }

        const q = query(
            collection(db, 'reservations'),
            ...constraints,
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newSales: Reservation[] = [];
                snapshot.forEach((doc) => {
                    newSales.push({
                        id: doc.id,
                        ...doc.data()
                    } as Reservation);
                });
                setSales(newSales);
                setLoading(false);
            },
            (err) => {
                console.error('Sales listener error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [options.eventId, options.status]);

    return { sales, loading, error };
}

/**
 * Hook to listen for today's sales total
 */
export function useTodaysSalesTotal(): {
    total: number;
    count: number;
    loading: boolean;
} {
    const [total, setTotal] = useState(0);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);

        const q = query(
            collection(db, 'reservations'),
            where('status', '==', 'confirmed'),
            where('timestamp', '>=', todayTimestamp),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let newTotal = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                newTotal += data.totalAmount || 0;
            });
            setTotal(newTotal);
            setCount(snapshot.size);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { total, count, loading };
}
