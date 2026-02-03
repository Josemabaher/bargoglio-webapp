"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaPlus, FaCalendarAlt, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import { db } from "@/src/lib/firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { formatDate } from "@/src/lib/utils/format";

interface Event {
    id: string;
    name: string;
    date: string;
    time: string;
    flyerUrl?: string;
    description?: string;
    category?: 'show' | 'cultural';
}

export default function ShowsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const eventsRef = collection(db, 'events');
            const eventsSnapshot = await getDocs(eventsRef);

            const fetchedEvents: Event[] = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || doc.data().title || 'Sin título',
                date: doc.data().date || '',
                time: doc.data().time || '',
                flyerUrl: doc.data().flyerUrl || '',
                description: doc.data().description || '',
                category: doc.data().category || 'show',
            }));

            // Sort by date
            fetchedEvents.sort((a, b) => a.date.localeCompare(b.date));
            setEvents(fetchedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm("¿Estás seguro de que querés eliminar este show?")) return;

        setDeletingId(eventId);
        try {
            // Delete seats subcollection first
            const seatsRef = collection(db, 'events', eventId, 'seats');
            const seatsSnapshot = await getDocs(seatsRef);
            for (const seatDoc of seatsSnapshot.docs) {
                await deleteDoc(seatDoc.ref);
            }

            // Delete reservations for this event
            const reservationsRef = collection(db, 'reservations');
            const reservationsSnapshot = await getDocs(reservationsRef);
            for (const resDoc of reservationsSnapshot.docs) {
                if (resDoc.data().eventId === eventId) {
                    await deleteDoc(resDoc.ref);
                }
            }

            // Delete the event
            await deleteDoc(doc(db, 'events', eventId));

            // Remove from local state
            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Error al eliminar el show");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Shows</h1>
                    <p className="text-stone-500 mt-1">Administrá tus eventos y shows programados.</p>
                </div>
                <Link
                    href="/admin/shows/new"
                    className="flex items-center gap-2 px-6 py-3 bg-bargoglio-orange text-white rounded-lg font-medium hover:bg-bargoglio-orange/80 transition-colors"
                >
                    <FaPlus className="w-4 h-4" />
                    Cargar Nuevo Show
                </Link>
            </div>

            {/* Shows Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <FaSpinner className="w-8 h-8 text-bargoglio-orange animate-spin" />
                </div>
            ) : events.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-12 text-center">
                    <FaCalendarAlt className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No hay shows cargados</h3>
                    <p className="text-stone-500 mb-6">Creá tu primer evento para comenzar.</p>
                    <Link
                        href="/admin/shows/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-bargoglio-orange text-white rounded-lg font-medium hover:bg-bargoglio-orange/80 transition-colors"
                    >
                        <FaPlus className="w-4 h-4" />
                        Cargar Nuevo Show
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden hover:border-bargoglio-orange/30 transition-all group"
                        >
                            {/* Event Image */}
                            <Link href={`/admin/shows/${event.id}`}>
                                <div className="aspect-[4/5] relative overflow-hidden">
                                    {event.flyerUrl ? (
                                        <img
                                            src={event.flyerUrl}
                                            alt={event.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-bargoglio-orange/30 to-stone-900 flex items-center justify-center">
                                            <FaCalendarAlt className="w-16 h-16 text-stone-700" />
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                                    {/* Category Badge */}
                                    <div className="absolute top-2 right-2">
                                        {event.category === 'cultural' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm border border-purple-400/30">
                                                🎭 Cultural
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bargoglio-orange/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm border border-orange-400/30">
                                                🎵 Show
                                            </span>
                                        )}
                                    </div>

                                    {/* Info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <p className="text-stone-400 text-xs">
                                            {formatDate(event.date)} {event.time && `• ${event.time}`}
                                        </p>
                                        <h3 className="text-white font-bold text-lg mt-1 line-clamp-2">
                                            {event.name}
                                        </h3>
                                    </div>
                                </div>
                            </Link>

                            {/* Actions */}
                            <div className="p-4 flex items-center justify-between border-t border-stone-800/50">
                                <Link
                                    href={`/admin/shows/${event.id}`}
                                    className="flex items-center gap-2 text-stone-400 hover:text-bargoglio-orange transition-colors text-sm"
                                >
                                    <FaEdit className="w-4 h-4" />
                                    Editar
                                </Link>
                                <button
                                    onClick={() => handleDelete(event.id)}
                                    disabled={deletingId === event.id}
                                    className="flex items-center gap-2 text-stone-400 hover:text-red-500 transition-colors text-sm disabled:opacity-50"
                                >
                                    {deletingId === event.id ? (
                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <FaTrash className="w-4 h-4" />
                                    )}
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
