"use client";

import { useEffect, useState } from "react";
import { FaTrash, FaTicketSimple, FaChevronRight, FaLock } from "react-icons/fa6";
import { Seat } from "@/src/types";
import { formatDate } from "@/src/lib/utils/format";
import { useAuth } from "@/src/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { getSeatDefinition } from "@/src/lib/data/seats";

interface ReservationSummaryProps {
    eventId: string;
    eventTitle?: string;
    selectedSeats: Seat[];
    eventDate: string;
    onRemoveSeat: (seatId: string) => void;
    onCheckout: () => void;
}

export default function ReservationSummary({ eventId, eventTitle = "Evento", selectedSeats, eventDate, onRemoveSeat, onCheckout }: ReservationSummaryProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [total, setTotal] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Calculate total tailored to your pricing logic. 
        // Assuming seat object might have a price attached or we look it up.
        // For now, I'll sum a mock 'price' property if it exists, or default to 0.
        // In a real scenario, you'd pass prices or look them up from the event data.
        const calculatedTotal = selectedSeats.reduce((sum, seat) => {
            return sum + (seat.price || 0);
        }, 0);
        setTotal(calculatedTotal);

        setIsVisible(selectedSeats.length > 0);
    }, [selectedSeats]);

    if (!isVisible) return null;

    return (
        <div className="sticky top-24 z-30 transition-all duration-500 animate-slide-up">
            <div className="bg-charcoal-900 border border-gold-500/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-gold-400 font-serif font-bold text-lg flex items-center gap-2">
                        <FaTicketSimple /> Tu Reserva
                    </h3>
                    <span className="text-xs text-stone-400 uppercase tracking-wider">
                        {formatDate(eventDate)}
                    </span>
                </div>

                {/* Seat List */}
                <div className="p-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gold-600 scrollbar-track-charcoal-800">
                    {selectedSeats.length === 0 ? (
                        <p className="text-stone-500 text-sm text-center py-4 italic">Selecciona asientos en el mapa...</p>
                    ) : (
                        <ul className="space-y-3">
                            {selectedSeats.map((seat) => (
                                <li key={seat.id} className="flex justify-between items-center group bg-white/5 p-2 rounded border border-transparent hover:border-white/10 transition-colors">
                                    <div>
                                        <div className="text-sm font-bold text-stone-200">
                                            {(() => {
                                                const def = getSeatDefinition(seat.id);
                                                return def?.tableNumber
                                                    ? `Mesa ${def.tableNumber}`
                                                    : (seat.tableId ? `Mesa ${seat.label}` : 'Entrada General');
                                            })()}
                                        </div>
                                        <div className="text-xs text-stone-400">
                                            {(() => {
                                                const def = getSeatDefinition(seat.id);
                                                return def?.label || (seat.tableId ? 'Sector VIP' : 'Sector General');
                                            })()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-gold-400 font-bold">${seat.price}</span>
                                        <button
                                            onClick={() => onRemoveSeat(seat.id)}
                                            className="text-stone-500 hover:text-red-400 transition-colors p-1"
                                            aria-label="Eliminar asiento"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer / Total */}
                <div className="p-4 bg-charcoal-950 border-t border-gold-500/20">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-stone-400 text-sm uppercase tracking-widest">Total</span>
                        <span className="text-3xl font-serif font-bold text-white">${total.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={() => {
                            const items = selectedSeats.map(s => {
                                const def = getSeatDefinition(s.id);
                                const title = def?.tableNumber
                                    ? `Mesa ${def.tableNumber} - ${def.label}`
                                    : (s.tableId ? `Mesa ${s.label} (${s.tableId})` : `Entrada General`);

                                return {
                                    id: s.id,
                                    title,
                                    price: s.price || 0,
                                    quantity: 1
                                };
                            });

                            const cartState = {
                                eventId,
                                eventTitle: eventTitle,
                                eventDate,
                                items
                            };

                            localStorage.setItem("bargoglio_cart", JSON.stringify(cartState));

                            // Redirect to checkout summary
                            router.push("/checkout/summary");
                        }}
                        id="checkout-btn"
                        className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-charcoal-900 font-bold uppercase tracking-widest text-sm rounded shadow-lg shadow-gold-600/20 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                        Confirmar Reserva
                        <FaChevronRight className="group-hover:translate-x-1 transition-transform" size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
