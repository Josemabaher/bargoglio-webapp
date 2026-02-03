'use client';

import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaGift, FaUsers, FaCog, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import { db } from '@/src/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { formatDate } from "@/src/lib/utils/format";
import { UserProfile } from "@/src/types";
import { useSettings } from "@/src/hooks/useSettings";

interface Event {
    id: string;
    name: string;
    date: string;
    time: string;
    flyerUrl?: string;
}

interface EventWithReservations extends Event {
    reservationCount: number;
}

// ... (existing helper function if needed, but I'll inline the fix)

export default function DashboardPage() {
    const [todayShow, setTodayShow] = useState<{ name: string; reservations: number } | null>(null);
    const [birthdaysThisWeek, setBirthdaysThisWeek] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<EventWithReservations[]>([]);
    const [loading, setLoading] = useState(true);

    // Service Fee Config State
    const { settings, updateServiceFee } = useSettings();
    const [newFee, setNewFee] = useState<string>("");
    const [isEditingFee, setIsEditingFee] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get today's date normalized to midnight
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today

                const todayStr = today.toISOString().split('T')[0];

                // Fetch all events
                const eventsRef = collection(db, 'events');
                const eventsSnapshot = await getDocs(eventsRef);
                const events: Event[] = eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Event));

                // Find today's show (ensure comparison matches string formats)
                // Note: e.date from Firestore is usually YYYY-MM-DD string.
                // todayStr is YYYY-MM-DD.
                const todayEvent = events.find(e => e.date === todayStr);

                if (todayEvent) {
                    // Count reservations for today's show
                    const reservationsRef = collection(db, 'reservations');
                    const reservationsQuery = query(reservationsRef, where('eventId', '==', todayEvent.id));
                    const reservationsSnapshot = await getDocs(reservationsQuery);

                    // Count total seats reserved
                    let totalSeats = 0;
                    reservationsSnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        totalSeats += data.seatIds?.length || 0;
                    });

                    setTodayShow({ name: todayEvent.name, reservations: totalSeats });
                } else {
                    setTodayShow(null);
                }

                // Get upcoming events (next 9)
                const futureEvents = events
                    .filter(e => e.date >= todayStr)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 9);

                // Get reservation counts for each event
                const eventsWithReservations: EventWithReservations[] = await Promise.all(
                    futureEvents.map(async (event) => {
                        const reservationsRef = collection(db, 'reservations');
                        const reservationsQuery = query(reservationsRef, where('eventId', '==', event.id));
                        const reservationsSnapshot = await getDocs(reservationsQuery);
                        let totalSeats = 0;
                        reservationsSnapshot.docs.forEach(doc => {
                            const data = doc.data();
                            totalSeats += data.seatIds?.length || 0;
                        });
                        return { ...event, reservationCount: totalSeats };
                    })
                );
                setUpcomingEvents(eventsWithReservations);

                // Count birthdays this week
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);

                // Calculate week range normalized
                const weekFromNow = new Date(today);
                weekFromNow.setDate(today.getDate() + 7);

                let birthdayCount = 0;
                usersSnapshot.docs.forEach(doc => {
                    const user = doc.data() as UserProfile;
                    const birthDateRef = user.fecha_nacimiento as any; // Allow string or Timestamp for legacy compatibility

                    if (birthDateRef) {
                        let birthMonth: number;
                        let birthDay: number;

                        if (typeof birthDateRef === 'string') {
                            // Assume YYYY-MM-DD. Parse parts manually to avoid timezone shifts
                            // Splits "1990-05-20" -> [1990, 05, 20]
                            const parts = birthDateRef.split('-');
                            if (parts.length === 3) {
                                birthMonth = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
                                birthDay = parseInt(parts[2], 10);
                            } else {
                                return; // Invalid format
                            }
                        } else if (birthDateRef instanceof Timestamp) {
                            const d = birthDateRef.toDate();
                            birthMonth = d.getMonth();
                            birthDay = d.getDate();
                        } else {
                            // Should typically be one of the above if schema is respected
                            const d = new Date(birthDateRef);
                            birthMonth = d.getMonth();
                            birthDay = d.getDate();
                        }

                        // Create this year's birthday date at midnight
                        const thisYearBday = new Date(today.getFullYear(), birthMonth, birthDay);
                        thisYearBday.setHours(0, 0, 0, 0);

                        // Handle if birthday has passed this year, check if next year is within range (e.g. late Dec -> early Jan)
                        if (thisYearBday < today) {
                            // If today is Dec 30 and bday is Jan 2, thisYearBday (Jan 2 2024) < today (Dec 30 2024)? No.
                            // If today is Dec 30 2024. Bday Jan 2.
                            // `thisYearBday` = Jan 2 2024. < today.
                            // Correct check:
                            thisYearBday.setFullYear(today.getFullYear() + 1);
                        }

                        // Check if in range [today, weekFromNow]
                        if (thisYearBday >= today && thisYearBday <= weekFromNow) {
                            birthdayCount++;
                        }
                    }
                });
                setBirthdaysThisWeek(birthdayCount);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSaveFee = async () => {
        const val = parseFloat(newFee);
        if (!isNaN(val) && val >= 0 && val <= 100) {
            const success = await updateServiceFee(val / 100);
            if (success) {
                setIsEditingFee(false);
                setNewFee("");
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-white">Dashboard</h1>
                <p className="text-stone-500 mt-1">Bienvenido al panel de administración de Bargoglio.</p>
            </div>

            {/* Top Stats Cards - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Show */}
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                                {todayShow?.name || 'HOY NO HAY NADA PROGRAMADO'}
                            </h3>
                            <p className="text-stone-500 text-sm mt-1">
                                {todayShow ? 'Reservas para hoy' : 'Consulta próximos eventos abajo'}
                            </p>
                            {todayShow && (
                                <p className="text-4xl font-bold text-white mt-2">
                                    {loading ? '...' : todayShow.reservations}
                                </p>
                            )}
                        </div>
                        <div className="bg-bargoglio-orange p-3 rounded-lg">
                            <FaCalendarAlt className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Birthdays This Week */}
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-stone-500 text-sm">Cumpleaños Esta Semana</p>
                            <p className="text-4xl font-bold text-white mt-2">
                                {loading ? '...' : birthdaysThisWeek}
                            </p>
                        </div>
                        <div className="bg-purple-600 p-3 rounded-lg">
                            <FaGift className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    href="/admin/shows"
                    className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 hover:border-bargoglio-orange/50 transition-all hover:scale-[1.02] group"
                >
                    <h3 className="text-lg font-semibold text-white group-hover:text-bargoglio-orange transition-colors">
                        Cargar Nuevo Show
                    </h3>
                    <p className="text-stone-500 text-sm mt-2">
                        Crear un nuevo evento con precios por zona y flyer.
                    </p>
                </Link>

                <Link
                    href="/admin/crm"
                    className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 hover:border-bargoglio-orange/50 transition-all hover:scale-[1.02] group"
                >
                    <h3 className="text-lg font-semibold text-white group-hover:text-bargoglio-orange transition-colors">
                        Gestionar Clientes
                    </h3>
                    <p className="text-stone-500 text-sm mt-2">
                        Ver lista de clientes, cumpleaños y notas del staff.
                    </p>
                </Link>

                {/* Service Fee Config Widget */}
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 hover:border-bargoglio-orange/50 transition-all">
                    <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-white group-hover:text-bargoglio-orange transition-colors">
                            Servicio de ticketera
                        </h3>
                        <div className="bg-stone-800 p-2 rounded-lg">
                            <FaCog className="text-stone-400 group-hover:text-white" />
                        </div>
                    </div>

                    <div className="mt-4">
                        {!isEditingFee ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-stone-500 text-sm">Porcentaje actual</p>
                                    <p className="text-2xl font-bold text-white">
                                        {(settings.serviceFeePercentage * 100).toFixed(0)}%
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setNewFee((settings.serviceFeePercentage * 100).toString());
                                        setIsEditingFee(true);
                                    }}
                                    className="text-sm text-bargoglio-orange hover:underline"
                                >
                                    Editar
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={newFee}
                                    onChange={(e) => setNewFee(e.target.value)}
                                    className="w-20 bg-black border border-stone-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-bargoglio-orange"
                                    min="0"
                                    max="100"
                                />
                                <span className="text-white">%</span>
                                <button
                                    onClick={handleSaveFee}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
                                >
                                    OK
                                </button>
                                <button
                                    onClick={() => setIsEditingFee(false)}
                                    className="px-3 py-1 bg-stone-700 text-white text-xs rounded hover:bg-stone-600"
                                >
                                    X
                                </button>
                            </div>
                        )}
                        <p className="text-stone-500 text-xs mt-2">
                            Aplica a todas las compras nuevas.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upcoming Events Section */}
            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                        Próximos Eventos
                    </h2>
                    <div className="w-24 h-1 bg-bargoglio-orange mt-2 rounded-full"></div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <div key={i} className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden animate-pulse">
                                <div className="aspect-[4/3] bg-stone-800"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-stone-800 rounded w-1/2"></div>
                                    <div className="h-6 bg-stone-800 rounded w-3/4"></div>
                                    <div className="h-4 bg-stone-800 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : upcomingEvents.length === 0 ? (
                    <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-8 text-center">
                        <p className="text-stone-500">No hay eventos programados</p>
                        <Link href="/admin/shows" className="text-bargoglio-orange hover:underline mt-2 inline-block">
                            + Crear nuevo show
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {upcomingEvents.map((event) => (
                            <Link
                                key={event.id}
                                href={`/admin/reservations?event=${event.id}`}
                                className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden hover:border-bargoglio-orange/50 transition-all hover:scale-[1.02] group"
                            >
                                {/* Event Image */}
                                <div className="aspect-[4/3] relative overflow-hidden">
                                    {event.flyerUrl ? (
                                        <img
                                            src={event.flyerUrl}
                                            alt={event.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-bargoglio-orange/30 to-stone-900 flex items-center justify-center">
                                            <FaCalendarAlt className="w-12 h-12 text-stone-700" />
                                        </div>
                                    )}
                                    {/* Gradient overlay at bottom */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                                    {/* Info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <p className="text-stone-400 text-xs">
                                            {formatDate(event.date)} / {event.time} hs
                                        </p>
                                        <h3 className="text-white font-bold text-lg uppercase mt-1">
                                            {event.name}
                                        </h3>
                                        <p className="text-stone-500 text-xs mt-1">Cantidad de reservas</p>
                                        <p className="text-white text-2xl font-bold">{event.reservationCount}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
