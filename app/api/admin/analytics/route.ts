import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { startOfMonth, subMonths, format, startOfWeek, addDays, getHours } from 'date-fns';

export const dynamic = 'force-dynamic'; // Ensure not cached by Vercel

export async function GET(req: NextRequest) {
    try {
        // In a real app, verify Admin Auth Token here. 
        // For now, relying on Next.js middleware protection or similar (assuming /admin is protected)

        // ==========================================
        // 1. DATA FETCHING (Parallel for speed)
        // ==========================================
        const [reservationsSnap, eventsSnap, usersSnap] = await Promise.all([
            adminDb.collection('reservations').get(),
            adminDb.collection('events').get(),
            adminDb.collection('users').get()
        ]);

        const reservations = reservationsSnap.docs.map(d => d.data());
        const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // ==========================================
        // 2. PILLAR A: REVENUE & SALES
        // ==========================================
        let totalRevenue = 0;
        let netRevenue = 0; // After ~6% fee
        const revenueByMonth: Record<string, number> = {};
        const revenueByShow: Record<string, number> = {};

        reservations.forEach(res => {
            if (res.status === 'confirmed') {
                const amount = Number(res.amount) || 0;
                totalRevenue += amount;
                netRevenue += amount * 0.94; // Deduct 6% approx

                // Group by Month (YYYY-MM)
                let dateKey = 'Unknown';
                if (res.createdAt && res.createdAt.toDate) {
                    dateKey = format(res.createdAt.toDate(), 'yyyy-MM');
                } else if (res.createdAt) {
                    // Handle string or timestamp
                    const d = new Date(res.createdAt);
                    if (!isNaN(d.getTime())) dateKey = format(d, 'yyyy-MM');
                }

                revenueByMonth[dateKey] = (revenueByMonth[dateKey] || 0) + amount;

                // Group by Show ID
                if (res.eventId) {
                    revenueByShow[res.eventId] = (revenueByShow[res.eventId] || 0) + amount;
                }
            }
        });

        // Weekly Projection (Money from future events)
        const today = new Date();
        const futureEvents = events.filter((e: any) => new Date(e.date) >= today);
        let projectedRevenue = 0;
        // This is tricky without knowing sold seats per future event perfectly from 'events' collection, 
        // but we can sum reservations linked to future events.
        const futureEventIds = new Set(futureEvents.map(e => e.id));
        reservations.forEach(res => {
            if (futureEventIds.has(res.eventId) && res.status === 'confirmed') {
                projectedRevenue += Number(res.amount) || 0;
            }
        });


        // ==========================================
        // 3. PILLAR B: OCCUPANCY
        // ==========================================
        let totalOccupancyPercent = 0;
        let eventCountForOccupancy = 0;
        const lowDemandEvents: any[] = [];

        events.forEach((event: any) => {
            // Assuming event has 'totalSeats' (e.g. 100) and 'occupiedSeats' or we count from subcollection
            // Data structure might be complex here. 
            // Simplified approach: check if event has a summary field or we'd need to fetch subcollections (expensive).
            // For this MVP, let's assume 'capacity' is fixed (e.g. 80) if not on event, and we count reservations.
            // Or better, let's look at 'seats' map if available on event doc, but that's a subcollection usually.

            // Workaround: Count reservations * seats for this event
            // NOTE: Exact seat count requires 'seatIds' array in reservation
        });

        // Alternative Occupancy Calculation using Reservations
        const eventOccupancy: Record<string, number> = {};
        reservations.forEach(res => {
            if (res.eventId && res.status === 'confirmed' && Array.isArray(res.seatIds)) {
                eventOccupancy[res.eventId] = (eventOccupancy[res.eventId] || 0) + res.seatIds.length;
            }
        });

        const STANDARD_CAPACITY = 80; // Hardcoded estimate if dynamic total missing

        events.forEach((event: any) => {
            const sold = eventOccupancy[event.id] || 0;
            const capacity = event.totalSeats || STANDARD_CAPACITY;
            const occupancy = (sold / capacity) * 100;

            totalOccupancyPercent += occupancy;
            eventCountForOccupancy++;

            // Check low demand (Events in next 48hs with < 40%)
            const eventDate = new Date(event.date);
            const diffHours = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60);
            if (diffHours > 0 && diffHours < 48 && occupancy < 40) {
                lowDemandEvents.push({
                    id: event.id,
                    title: event.title,
                    occupancy: Math.round(occupancy),
                    date: event.date
                });
            }
        });

        const avgOccupancy = eventCountForOccupancy > 0 ? (totalOccupancyPercent / eventCountForOccupancy) : 0;


        // ==========================================
        // 4. PILLAR C: LOYALTY & RETENTION
        // ==========================================
        // Logic: Users with > 1 completed purchase (reservation)
        // Since we didn't always have 'points' or strict user linking, we can count unique userIds in reservations.

        const userReservationCounts: Record<string, number> = {};
        reservations.forEach(res => {
            if (res.userId && res.userId !== 'guest' && res.userId !== 'guest_unknown') {
                userReservationCounts[res.userId] = (userReservationCounts[res.userId] || 0) + 1;
            }
        });

        let returningCustomers = 0;
        let totalUniqueCustomers = Object.keys(userReservationCounts).length;

        Object.values(userReservationCounts).forEach(count => {
            if (count > 1) returningCustomers++;
        });

        const retentionRate = totalUniqueCustomers > 0 ? (returningCustomers / totalUniqueCustomers) * 100 : 0;

        // New Customers (Last 30 days)
        const thirtyDaysAgo = subMonths(today, 1);
        const newCustomersCount = users.filter((u: any) => {
            if (!u.createdAt) return false;
            // Handle Timestamp vs Date string
            const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
            return d >= thirtyDaysAgo;
        }).length;

        // Ambassadors (Top 10 by points)
        const ambassadors = users
            .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
            .slice(0, 10)
            .map((u: any) => ({
                id: u.id,
                name: `${u.nombre} ${u.apellido}`,
                points: u.points || 0,
                email: u.email,
                avatar: u.photoUrl || null,
                visitCount: userReservationCounts[u.id] || 0,
                // Mock favorite show for now, or derive from history
                favoriteGenre: 'Jazz Tradicional'
            }));


        // ==========================================
        // 5. PILLAR D: HEATMAP & GOLDEN HOURS
        // ==========================================

        // Heatmap (Zone Popularity)
        // Naive parsing of seat IDs: "mesa-1-A" -> Zone "Mesa" / "barra-5" -> Zone "Barra"
        const zoneCounts: Record<string, number> = {};
        reservations.forEach(res => {
            if (Array.isArray(res.seatIds)) {
                res.seatIds.forEach((seat: string) => {
                    const prefix = seat.split('-')[0]; // e.g. "mesa", "barra", "gradah"
                    if (prefix) {
                        const zoneName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
                        zoneCounts[zoneName] = (zoneCounts[zoneName] || 0) + 1;
                    }
                });
            }
        });

        // Golden Hours (Purchase Time)
        const salesByHour = new Array(24).fill(0);
        reservations.forEach(res => {
            let d: Date | null = null;
            if (res.createdAt && res.createdAt.toDate) d = res.createdAt.toDate();
            else if (res.createdAt) d = new Date(res.createdAt);

            if (d && !isNaN(d.getTime())) {
                const hour = getHours(d);
                salesByHour[hour]++;
            }
        });

        const goldenHoursData = salesByHour.map((count, hour) => ({ hour, count }));


        // ==========================================
        // FINAL PAYLOAD
        // ==========================================
        return NextResponse.json({
            revenue: {
                total: totalRevenue,
                net: netRevenue,
                projectedWeekly: projectedRevenue,
                ticketAverage: totalRevenue / (reservations.length || 1), // Simple calculation
                byMonth: Object.entries(revenueByMonth).map(([name, value]) => ({ name, value })),
            },
            occupancy: {
                average: Math.round(avgOccupancy),
                lowDemandAlerts: lowDemandEvents
            },
            loyalty: {
                retentionRate: Math.round(retentionRate),
                newCustomers: newCustomersCount,
                ambassadors: ambassadors
            },
            heatmap: {
                popularZones: Object.entries(zoneCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
                goldenHours: goldenHoursData
            }
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
    }
}
