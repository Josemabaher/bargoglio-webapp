'use client';

import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaGift, FaUsers, FaCog, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import { db } from '@/src/lib/firebase/config';
import { INITIAL_SEATS } from "@/src/lib/data/seats";
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
    const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
    const [showBirthdayModal, setShowBirthdayModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Service Fee Config State
    const { settings, updateServiceFee } = useSettings();
    const [newFee, setNewFee] = useState<string>("");
    const [isEditingFee, setIsEditingFee] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get today's date normalized to midnight LOCAL TIME
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

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

                // Calculate range (Next 15 Days)
                const rangeEnd = new Date(today);
                rangeEnd.setDate(today.getDate() + 15);

                let birthdayList: any[] = [];
                usersSnapshot.docs.forEach(doc => {
                    const user = doc.data() as UserProfile;
                    const birthDateRef = user.fecha_nacimiento as any;

                    if (birthDateRef) {
                        let birthMonth: number;
                        let birthDay: number;

                        if (typeof birthDateRef === 'string') {
                            const parts = birthDateRef.split('-');
                            if (parts.length === 3) {
                                birthMonth = parseInt(parts[1], 10) - 1;
                                birthDay = parseInt(parts[2], 10);
                            } else {
                                return;
                            }
                        } else if (birthDateRef instanceof Timestamp) {
                            const d = birthDateRef.toDate();
                            birthMonth = d.getMonth();
                            birthDay = d.getDate();
                        } else {
                            const d = new Date(birthDateRef);
                            birthMonth = d.getMonth();
                            birthDay = d.getDate();
                        }

                        const thisYearBday = new Date(today.getFullYear(), birthMonth, birthDay);
                        thisYearBday.setHours(0, 0, 0, 0);

                        if (thisYearBday < today) {
                            thisYearBday.setFullYear(today.getFullYear() + 1);
                        }

                        if (thisYearBday >= today && thisYearBday <= rangeEnd) {
                            birthdayList.push({
                                uid: doc.id,
                                nombre: user.nombre,
                                apellido: user.apellido,
                                fecha: thisYearBday.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
                                rawDate: thisYearBday
                            });
                        }
                    }
                });

                // Sort by date
                birthdayList.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
                setBirthdaysThisWeek(birthdayList.length);
                setUpcomingBirthdays(birthdayList);

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
                <p className="text-stone-500 mt-1">Bienvenido al panel de administración de Bargoglio. <span className="text-xs text-stone-700 ml-2">(v2.1 - Calib Updated)</span></p>
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
                                <div>
                                    <p className="text-4xl font-bold text-white mt-2">
                                        {loading ? '...' : todayShow.reservations} <span className="text-stone-500 text-lg font-normal">/ {INITIAL_SEATS.length}</span>
                                    </p>
                                    <p className="text-stone-500 text-xs mt-1">
                                        Libres: <span className="text-green-500 font-bold">{INITIAL_SEATS.length - todayShow.reservations}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="bg-bargoglio-orange p-3 rounded-lg">
                            <FaCalendarAlt className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Birthdays This Week */}
                {/* Birthdays This Week */}
                <div
                    onClick={() => setShowBirthdayModal(true)}
                    className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 cursor-pointer hover:border-purple-500/50 transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-stone-500 text-sm group-hover:text-purple-400 transition-colors">Cumpleaños Próx. 15 días</p>
                            <p className="text-4xl font-bold text-white mt-2">
                                {loading ? '...' : birthdaysThisWeek}
                            </p>
                        </div>
                        <div className="bg-purple-600 p-3 rounded-lg group-hover:bg-purple-500 transition-colors">
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
            {/* Birthday List Modal */}
            {showBirthdayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowBirthdayModal(false)}>
                    <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl border border-stone-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FaGift className="text-purple-500" /> Próximos Cumpleaños (15 días)
                            </h3>
                            <button onClick={() => setShowBirthdayModal(false)} className="text-stone-500 hover:text-white">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            {upcomingBirthdays.length === 0 ? (
                                <p className="text-stone-500 text-center py-8">No hay cumpleaños en los próximos 15 días.</p>
                            ) : (
                                upcomingBirthdays.map((bday) => (
                                    <div key={bday.uid} className="flex items-center justify-between bg-stone-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                                                {bday.nombre[0]}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{bday.nombre} {bday.apellido}</p>
                                                <p className="text-stone-400 text-sm">{bday.fecha}</p>
                                            </div>
                                        </div>
                                        <Link href={`/admin/crm?search=${bday.email || bday.nombre}`} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                            Ver Perfil
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
