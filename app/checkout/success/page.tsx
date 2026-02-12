"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaTicketAlt, FaHome, FaCircleNotch } from "react-icons/fa";
import Navbar from "../../components/Navbar";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("payment_id");
    const [loading, setLoading] = useState(true);

    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // Countdown timer
        const interval = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        // Redirect after 3 seconds
        const timeout = setTimeout(() => {
            // Use window.location for a hard redirect if router.push fails or for analytics compatibility
            window.location.href = "/?success=true";
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [router]);

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
                            <br />
                            <span className="text-sm text-stone-500 mt-2 block">
                                Redirigiendo al inicio en <span className="text-gold-400 font-bold">{countdown}</span> segundos...
                            </span>
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
                                onClick={() => window.location.href = "/?success=true"}
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

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <FaCircleNotch className="w-12 h-12 text-gold-500 animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
