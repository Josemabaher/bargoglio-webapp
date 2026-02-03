"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Seat } from "@/src/types";
import Navbar from "../../components/Navbar";
import TableMap from "../../components/TableMap";
import ReservationSummary from "../../components/ReservationSummary";
import { useSeats } from "@/src/hooks/useSeats";
import { db } from "@/src/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { formatDate } from "@/src/lib/utils/format";
import { useAuth } from "@/src/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaTicketSimple, FaChevronRight, FaLock, FaMinus, FaPlus } from "react-icons/fa6";

function GeneralAdmissionCheckout({ eventId, eventTitle, price, date }: { eventId: string, eventTitle: string, price: number, date: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleCheckout = () => {
        // Create cart object
        const cartItem = {
            id: 'general',
            title: `${eventTitle} - Entrada General`,
            price: price,
            quantity: quantity
        };

        const cartState = {
            eventId,
            eventTitle,
            eventDate: date,
            items: [cartItem]
        };

        // Save to LocalStorage
        localStorage.setItem("bargoglio_cart", JSON.stringify(cartState));

        // Redirect to Summary
        router.push("/checkout/summary");
    };

    return (
        <div className="bg-charcoal-900 border border-gold-500/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-gold-400 font-serif font-bold text-lg flex items-center gap-2">
                    <FaTicketSimple /> Comprar Entradas
                </h3>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-white font-bold text-lg">Entrada General</p>
                        <p className="text-stone-400 text-sm">{formatDate(date)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gold-400 font-mono text-xl font-bold">${price}</p>
                    </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 mb-6 border border-white/10">
                    <span className="text-stone-300 text-sm uppercase tracking-wider">Cantidad</span>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                        >
                            <FaMinus size={10} />
                        </button>
                        <span className="text-xl font-bold text-white w-6 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                        >
                            <FaPlus size={10} />
                        </button>
                    </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-end mb-6 pt-4 border-t border-white/10">
                    <span className="text-stone-400 text-sm uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-serif font-bold text-white">${(price * quantity).toLocaleString()}</span>
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-charcoal-900 font-bold uppercase tracking-widest text-sm rounded shadow-lg shadow-gold-600/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Procesando..." : user ? (
                        <>
                            Ir al Pago
                            <FaChevronRight className="group-hover:translate-x-1 transition-transform" size={12} />
                        </>
                    ) : (
                        <>
                            <FaLock size={12} /> Iniciar Sesión para Comprar
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function EventPage() {
    const params = useParams();
    // Decode the eventId in case it's URL encoded
    const rawEventId = params.id as string;
    const eventId = rawEventId ? decodeURIComponent(rawEventId) : '';

    const [event, setEvent] = useState<any | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);

    // Fetch event directly from Firebase
    useEffect(() => {
        const fetchEvent = async () => {


            try {
                const eventRef = doc(db, 'events', eventId);
                const eventDoc = await getDoc(eventRef);

                if (eventDoc.exists()) {
                    const data = eventDoc.data();
                    setEvent({
                        id: eventDoc.id,
                        title: data.name || data.title || 'Sin título',
                        description: data.description || '',
                        flyerUrl: data.flyerUrl || '',
                        date: data.date || '',
                        time: data.time || '',
                        zonesPrices: data.zonesPrices || [],
                        pricingType: data.pricingType || (data.zonesPrices?.length > 0 ? 'zones' : 'general'),
                        generalPrice: data.generalPrice || 0,
                    });
                } else {
                    setEvent(null);
                }
            } catch (error) {
                console.error("Error fetching event:", error);
                setEvent(null);
            } finally {
                setLoadingEvent(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const { seats, loading: loadingSeats } = useSeats(eventId);
    const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

    const handleToggleSeat = (seat: Seat) => {
        setSelectedSeats((prev) => {
            const exists = prev.find((s) => s.id === seat.id);
            if (exists) {
                return prev.filter((s) => s.id !== seat.id);
            } else {
                return [...prev, seat];
            }
        });
    };

    const handleRemoveSeat = (seatId: string) => {
        setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
    };

    if (loadingEvent) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center">
                Cargando evento...
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-serif text-white mb-4">Evento no encontrado</h1>
                <a href="/" className="text-gold-400 hover:underline">Volver al inicio</a>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-stone-950 text-stone-200 selection:bg-gold-500/30 font-sans">
            <Navbar />

            <section className="pt-32 pb-12 px-4 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-12 border-b border-white/10 pb-8">
                    <div className="w-full md:w-1/3 aspect-[4/5] relative rounded-xl overflow-hidden shadow-2xl">
                        <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-full md:w-2/3">
                        <span className="text-gold-400 font-bold tracking-widest uppercase text-sm mb-2 block">
                            {formatDate(event.date)}
                        </span>
                        <h1 className="text-xl md:text-2xl font-serif font-bold text-white mb-4 leading-tight whitespace-pre-wrap">
                            {event.title}
                        </h1>
                        <p className="text-stone-400 text-lg max-w-2xl leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>

                        {/* Event Type / Price Info for non-zone events */}
                        {event.pricingType === 'free' && (
                            <div className="mt-6 inline-block px-4 py-2 bg-green-900/30 border border-green-500/50 text-green-400 rounded-lg font-bold uppercase tracking-widest">
                                Entrada Libre
                            </div>
                        )}
                        {event.pricingType === 'general' && (
                            <div className="mt-6 inline-block px-4 py-2 bg-bargoglio-red/10 border border-bargoglio-red/50 text-bargoglio-red rounded-lg font-bold uppercase tracking-widest">
                                Entrada General: ${event.generalPrice}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Content Area (Map or Message) */}
                    <div className="lg:col-span-8 space-y-8">
                        {event.pricingType === 'zones' ? (
                            <>
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-white mb-4">Seleccioná tus ubicaciones</h2>

                                    <p className="text-stone-400 mb-4">
                                        Hacé click en las sillas disponibles (verde) para agregarlas a tu reserva.
                                        <br />
                                        Podés hacer zoom para ver mejor.
                                    </p>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-6 text-sm text-stone-300 mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-green-600 border border-white/20"></span>
                                            <span>Disponible</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-yellow-500 border border-white/20"></span>
                                            <span>Tu Selección</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-red-900 border border-white/20"></span>
                                            <span>Ocupado</span>
                                        </div>
                                    </div>

                                    {/* Zone Prices Display */}
                                    {event.zonesPrices && event.zonesPrices.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {event.zonesPrices.map((zp: any, idx: number) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                                                    <span className="text-stone-400 text-sm font-bold uppercase tracking-wider">{zp.zone || zp.zoneName}:</span>
                                                    <span className="text-gold-400 font-bold text-lg">${zp.price.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {loadingSeats ? (
                                    <div className="w-full h-[500px] bg-charcoal-900 rounded-xl flex items-center justify-center border border-white/10">
                                        <span className="text-gold-400 animate-pulse">Cargando plano de sala...</span>
                                    </div>
                                ) : (
                                    <TableMap
                                        seats={seats}
                                        selectedSeatIds={selectedSeats.map((s) => s.id)}
                                        onToggleSeat={handleToggleSeat}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-8 text-center min-h-[300px] flex flex-col justify-start items-center pt-12">
                                <span className="text-4xl mb-4">✨</span>
                                <h3 className="text-2xl font-serif font-bold text-white mb-2">
                                    {event.pricingType === 'free' ? 'Evento de Entrada Libre' : 'Ubicación por orden de llegada'}
                                </h3>
                                <p className="text-stone-400 text-lg max-w-md mx-auto">
                                    {event.pricingType === 'free'
                                        ? "El ingreso es gratuito y por orden de llegada hasta agotar capacidad."
                                        : "Los lugares se asignan por orden de llegada. Te recomendamos venir temprano para conseguir una buena ubicación."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Checkout Summary - Only show if NOT free */}
                    {event.pricingType !== 'free' && (
                        <div className="lg:col-span-4 relative sticky top-24">
                            {event.pricingType === 'zones' ? (
                                <ReservationSummary
                                    eventId={eventId}
                                    eventTitle={event.title}
                                    selectedSeats={selectedSeats}
                                    eventDate={event.date}
                                    onRemoveSeat={handleRemoveSeat}
                                    onCheckout={() => { }}
                                />
                            ) : (
                                <GeneralAdmissionCheckout
                                    eventId={eventId}
                                    eventTitle={event.title}
                                    price={event.generalPrice}
                                    date={event.date}
                                />
                            )}

                            <div className="mt-6 text-center">
                                <a href="/" className="text-stone-500 hover:text-white text-sm transition-colors">
                                    ← Volver a la agenda
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Back link for Free events where checkout column is hidden */}
                    {event.pricingType === 'free' && (
                        <div className="lg:col-span-4 text-center lg:text-left">
                            <a href="/" className="text-gold-400 hover:underline text-lg transition-colors">
                                ← Volver a la agenda
                            </a>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
