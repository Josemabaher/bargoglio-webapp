"use client";

import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get("success") === "true") {
            setIsOpen(true);
            // Clean URL without refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-green-500/30 rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                        <FaCheckCircle className="w-8 h-8 text-green-500" />
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-white mb-2">
                        ¡Todo listo!
                    </h2>

                    <p className="text-stone-300 mb-6">
                        Tu reserva se confirmó con éxito. <br />
                        Enviamos los tickets a tu correo electrónico.
                    </p>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 bg-bargoglio-orange text-white font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-orange-900/20"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
