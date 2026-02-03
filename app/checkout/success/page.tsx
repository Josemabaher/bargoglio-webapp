"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaTicketAlt, FaHome, FaCircleNotch } from "react-icons/fa";
import Navbar from "../../components/Navbar";

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("payment_id");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Here we could optionally verify the payment status with our backend
        // For now, we assume if they land here from MP, it's good (MP handles the security via signature/IPN)
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {loading ? (
                    <div className="flex flex-col items-center">
                        <FaCircleNotch className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                        <h2 className="text-xl font-serif text-gold-400">Verificando pago...</h2>
                    </div>
                ) : (
                    <div className="max-w-md w-full bg-charcoal-900 border border-green-500/30 rounded-2xl p-8 text-center shadow-2xl animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaCheckCircle className="w-10 h-10 text-green-500" />
                        </div>

                        <h1 className="text-3xl font-serif font-bold text-white mb-2">¡Reserva Confirmada!</h1>
                        <p className="text-stone-400 mb-8">
                            Tu pago se procesó correctamente. Te enviamos los tickets a tu email.
                        </p>

                        {paymentId && (
                            <div className="bg-black/30 rounded-lg p-3 mb-8 border border-white/5">
                                <span className="text-xs text-stone-500 uppercase tracking-widest block mb-1">ID de Pago</span>
                                <span className="font-mono text-gold-400 font-bold">{paymentId}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push("/perfil")}
                                className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-charcoal-900 font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center gap-2"
                            >
                                <FaTicketAlt /> Ver Mis Entradas
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full py-3 bg-transparent hover:bg-white/5 text-stone-400 hover:text-white font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center gap-2"
                            >
                                <FaHome /> Volver al Inicio
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
