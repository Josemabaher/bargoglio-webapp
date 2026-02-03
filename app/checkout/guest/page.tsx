"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { FaLock, FaChevronLeft, FaCreditCard, FaUser, FaMapMarkerAlt, FaPhone, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import { formatDate } from "@/src/lib/utils/format";
import { GuestUser } from "@/src/types";
import { useAuth } from "@/src/lib/context/AuthContext";
import { db } from "@/src/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface CartState {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    items: any[];
}

export default function GuestCheckoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [cart, setCart] = useState<CartState | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState<GuestUser>({
        nombre: '',
        apellido: '',
        dni: '',
        fecha_nacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        provincia: ''
    });

    // Load Cart from LocalStorage
    useEffect(() => {
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

    // Auto-fill from Auth User
    useEffect(() => {
        const fillUserData = async () => {
            if (user?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setFormData(prev => ({
                            ...prev,
                            nombre: userData.nombre || '',
                            apellido: userData.apellido || '',
                            email: user.email || userData.email || '',
                            dni: userData.dni || '',
                            telefono: userData.telefono || '',
                            direccion: userData.direccion || '',
                            provincia: userData.provincia || '',
                            fecha_nacimiento: userData.fecha_nacimiento
                                ? (userData.fecha_nacimiento.toDate
                                    ? userData.fecha_nacimiento.toDate().toISOString().split('T')[0]
                                    : new Date(userData.fecha_nacimiento).toISOString().split('T')[0])
                                : ''
                        }));
                    } else if (user.email) {
                        setFormData(prev => ({ ...prev, email: user.email! }));
                    }
                } catch (error) {
                    console.log("Error fetching user data for checkout autofill", error);
                }
            }
        };

        fillUserData();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cart) return;

        setProcessing(true);

        try {
            // Re-calculate totals for security (backend should also validate)
            const subtotal = cart.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
            const serviceFee = subtotal * 0.08;

            // Prepare Payer Object matching API expectations
            const payerData = {
                ...formData,
                uid: user?.uid, // Send UID if logged in
                isGuest: !user // Flag as guest if not logged in
            };

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.items,
                    payer: payerData,
                    eventId: cart.eventId,
                    seatIds: cart.items.filter((i: any) => i.id !== 'general').map((i: any) => i.id),
                    serviceFee: serviceFee // Explicitly pass fee to be verified by backend
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error iniciando pago: " + (data.error || "Desconocido"));
                setProcessing(false);
            }

        } catch (error) {
            console.error("Payment error:", error);
            alert("Hubo un error al procesar la solicitud.");
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-gold-400">Cargando...</div>;

    if (!cart) {
        return (
            <main className="min-h-screen bg-stone-950 text-stone-200">
                <Navbar />
                <div className="pt-32 px-4 text-center">
                    <h1 className="text-3xl font-serif text-white mb-4">Sesión expirada</h1>
                    <a href="/" className="text-gold-400 hover:underline">Volver a empezar</a>
                </div>
            </main>
        );
    }

    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const serviceFee = subtotal * 0.08;
    const total = subtotal + serviceFee;

    return (
        <main className="min-h-screen bg-stone-950 text-stone-200 selection:bg-gold-500/30 font-sans">
            <Navbar />

            <section className="pt-32 pb-12 px-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-2 text-stone-500 mb-8 text-sm">
                    <button onClick={() => router.back()} className="hover:text-gold-400 transition-colors flex items-center gap-1">
                        <FaChevronLeft /> Volver al resumen
                    </button>
                    <span>/</span>
                    <span className="text-gold-400">Checkout</span>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Guest Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-charcoal-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl p-8">
                            <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                <FaUser className="text-gold-400" size={20} />
                                Información del Cliente
                            </h2>

                            <form id="checkout-form" onSubmit={handlePayment} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Nombre <span className="text-red-500">*</span></label>
                                        <input
                                            required name="nombre" value={formData.nombre} onChange={handleInputChange}
                                            className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                            placeholder="Ej. Juan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Apellido <span className="text-red-500">*</span></label>
                                        <input
                                            required name="apellido" value={formData.apellido} onChange={handleInputChange}
                                            className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                            placeholder="Ej. Pérez"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">DNI / Pasaporte <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <FaIdCard className="absolute left-3 top-3.5 text-stone-500" />
                                            <input
                                                required name="dni" value={formData.dni} onChange={handleInputChange}
                                                className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                                placeholder="Número de documento"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-3.5 text-stone-500" />
                                            <input
                                                required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange}
                                                className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Email <span className="text-red-500">*</span></label>
                                    <input
                                        required type="email" name="email" value={formData.email} onChange={handleInputChange}
                                        className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                        placeholder="juan@ejemplo.com"
                                    />
                                    <p className="text-xs text-stone-500">Te enviaremos las entradas a este correo.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Teléfono <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-3 top-3.5 text-stone-500" />
                                        <input
                                            required name="telefono" value={formData.telefono} onChange={handleInputChange}
                                            className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                            placeholder="+54 9 11 ..."
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Dirección <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3 top-3.5 text-stone-500" />
                                            <input
                                                required name="direccion" value={formData.direccion} onChange={handleInputChange}
                                                className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                                placeholder="Calle y altura"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-stone-400 font-bold block">Provincia <span className="text-red-500">*</span></label>
                                        <input
                                            required name="provincia" value={formData.provincia} onChange={handleInputChange}
                                            className="w-full bg-stone-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                            placeholder="Provincia"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Summary & Pay */}
                    <div className="lg:col-span-1">
                        <div className="bg-charcoal-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl sticky top-32">
                            <div className="p-6 bg-black/20 border-b border-white/5">
                                <h3 className="text-lg font-serif font-bold text-white mb-1">{cart.eventTitle}</h3>
                                <p className="text-stone-400 text-sm">{formatDate(cart.eventDate)}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-stone-300 text-sm">
                                    <span>Entradas ({cart.items.reduce((a, b) => a + b.quantity, 0)})</span>
                                    <span>${subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-300 text-sm">
                                    <span>Servicio Ticketera</span>
                                    <span>${serviceFee.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-white uppercase tracking-widest">Total</span>
                                    <span className="text-2xl font-serif font-bold text-gold-400">${total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-charcoal-950 border-t border-white/5">
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={processing}
                                    className="w-full py-4 bg-zinc-100 hover:bg-white text-zinc-900 font-bold uppercase tracking-widest text-sm rounded transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? "Procesando..." : (
                                        <>
                                            Pagar con Mercado Pago <FaChevronLeft className="rotate-180" />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-stone-600 mt-4 flex items-center justify-center gap-2">
                                    <FaLock size={10} /> Pagos procesados de forma segura
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
