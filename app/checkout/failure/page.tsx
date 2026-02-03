"use client";

import { useRouter } from "next/navigation";
import { FaTimesCircle, FaRedo, FaHome } from "react-icons/fa";
import Navbar from "../../components/Navbar";

export default function CheckoutFailurePage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-4">

                <div className="max-w-md w-full bg-charcoal-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl animate-fade-in-up">
                    <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaTimesCircle className="w-10 h-10 text-red-500" />
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Pago No Completado</h1>
                    <p className="text-stone-400 mb-8">
                        Hubo un problema al procesar tu pago. No se te ha cobrado nada. Por favor, intenta nuevamente.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.back()}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center gap-2"
                        >
                            <FaRedo /> Intentar Nuevamente
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-3 bg-transparent hover:bg-white/5 text-stone-400 hover:text-white font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center gap-2"
                        >
                            <FaHome /> Volver al Inicio
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
}
