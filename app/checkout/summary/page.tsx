"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { FaTicketSimple, FaArrowRight, FaChevronLeft } from "react-icons/fa6";
import { formatDate } from "@/src/lib/utils/format";
import { useSettings } from "@/src/hooks/useSettings";

interface CartItem {
    id: string; // seat id or 'general'
    title: string;
    price: number;
    quantity: number; // 1 for seats, N for general
}

interface CartState {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    items: CartItem[];
}

export default function CheckoutSummaryPage() {
    const router = useRouter();
    const [cart, setCart] = useState<CartState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load cart from localStorage
        const savedCart = localStorage.getItem("bargoglio_cart");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error parsing cart", e);
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-gold-400">Cargando resumen...</div>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <main className="min-h-screen bg-stone-950 text-stone-200">
                <Navbar />
                <div className="pt-32 px-4 text-center">
                    <h1 className="text-3xl font-serif text-white mb-4">El carrito está vacío</h1>
                    <a href="/" className="text-gold-400 hover:underline">Volver a la agenda</a>
                </div>
            </main>
        );
    }

    // Calculations
    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const { settings, loading: loadingSettings } = useSettings();
    const serviceFeePercentage = settings.serviceFeePercentage; // Dynamic from Firestore
    const serviceFee = subtotal * serviceFeePercentage;
    const total = subtotal + serviceFee;

    const handleContinue = () => {
        router.push("/checkout/guest");
    };

    return (
        <main className="min-h-screen bg-stone-950 text-stone-200 selection:bg-gold-500/30 font-sans">
            <Navbar />

            <section className="pt-32 pb-12 px-4 max-w-4xl mx-auto animate-fade-in">
                <div className="flex items-center gap-2 text-stone-500 mb-8 text-sm">
                    <button onClick={() => router.back()} className="hover:text-gold-400 transition-colors flex items-center gap-1">
                        <FaChevronLeft /> Volver
                    </button>
                    <span>/</span>
                    <span className="text-gold-400">Resumen de Compra</span>
                </div>

                <div className="bg-charcoal-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-gradient-to-r from-charcoal-800 to-charcoal-900">
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">{cart.eventTitle}</h1>
                        <p className="text-gold-400 uppercase tracking-widest text-sm">{formatDate(cart.eventDate)}</p>
                    </div>

                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-stone-300">Detalle de la compra</h2>
                            <span className="inline-block px-3 py-1 bg-white/5 rounded text-xs uppercase tracking-widest text-stone-300 border border-white/10">
                                {cart.items.reduce((acc, i) => acc + i.quantity, 0)} Tickets
                            </span>
                        </div>

                        {/* Items List */}
                        <div className="mb-8 space-y-4">
                            {cart.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-gold-400">
                                            <FaTicketSimple />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-stone-500 uppercase tracking-wider">
                                                {item.quantity} x ${item.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="font-mono text-lg text-white">
                                        ${(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals Box */}
                        <div className="bg-black/30 rounded-xl p-6 border border-white/5 space-y-3">
                            <div className="flex justify-between text-stone-400">
                                <span>Subtotal</span>
                                <span className="font-mono">${subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-stone-400">
                                <span>Servicio Ticketera ({(serviceFeePercentage * 100).toFixed(0)}%)</span>
                                <span className="font-mono">${serviceFee.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-white/10 my-2"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-white uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-serif font-bold text-gold-400">${total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-charcoal-950 border-t border-white/5 flex flex-col md:flex-row justify-end gap-4">
                        <button
                            onClick={handleContinue}
                            className="w-full md:w-auto px-8 py-4 bg-bargoglio-red hover:bg-[#8a1612] text-white font-bold uppercase tracking-widest text-sm rounded shadow-lg shadow-red-900/20 transition-all duration-300 flex items-center justify-center gap-3 group"
                        >
                            Finalizar Compra
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
