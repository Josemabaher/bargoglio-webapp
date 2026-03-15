'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/config';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ActivarCuentaContent() {
    const searchParams = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailFromUrl);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendResetEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSending(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err: any) {
            console.error("Error sending reset email:", err);
            if (err.code === 'auth/user-not-found') {
                setError("No encontramos una cuenta con ese correo. Verificá que sea el mismo que usaste para tu compra.");
            } else {
                setError("Hubo un error al enviar el correo. Por favor intentá de nuevo en unos minutos.");
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[50vh] h-[50vh] bg-[#A11A16]/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[40vh] h-[40vh] bg-gold-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md z-10 relative">
                {/* Logo Banner */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image 
                            src="/Bargoglio-Logo-Circulo-Transparente-02.png" 
                            alt="Club Bargoglio" 
                            width={100} 
                            height={100} 
                            className="drop-shadow-2xl opacity-90"
                        />
                    </div>
                    <h1 className="text-3xl font-serif text-gold-400 tracking-widest">BARGOGLIO</h1>
                    <p className="text-stone-400 text-sm tracking-[0.2em] mt-2 uppercase">Plataforma Cultural</p>
                </div>

                {/* Main Card */}
                <div className="bg-stone-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

                    {sent ? (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-2">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                </svg>
                            </div>
                            <h2 className="text-2xl text-white font-serif uppercase tracking-wider">¡Correo Enviado!</h2>
                            <p className="text-stone-300 font-light leading-relaxed">
                                Te enviamos un enlace a <strong className="text-gold-400 font-normal">{email}</strong> para que crees tu contraseña.
                                Revisá tu bandeja de entrada (y la carpeta de spam, por las dudas).
                            </p>
                            <p className="text-stone-500 text-xs">
                                El correo viene de <em>noreply@bargoglio-61dfc.firebaseapp.com</em>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <h2 className="text-2xl text-white font-serif uppercase tracking-wider mb-3">Activar Tu Cuenta</h2>
                                <p className="text-stone-400 text-sm leading-relaxed">
                                    ¡Bienvenido al Club! Ingresá tu correo para recibir un enlace seguro donde crear tu contraseña y acceder a tus puntos Bargoglio.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSendResetEmail} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold block">Tu Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-stone-950/50 border border-white/10 rounded-lg p-3.5 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all placeholder:text-stone-700"
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full relative group overflow-hidden bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 py-3.5 px-6 rounded-lg font-bold tracking-[0.15em] text-sm transition-all duration-300 uppercase mt-4 shadow-lg shadow-gold-500/20"
                                >
                                    <span className="relative z-10">
                                        {sending ? 'Enviando...' : 'Enviar Enlace de Activación'}
                                    </span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Help text */}
                <p className="text-center text-stone-600 text-xs mt-6">
                    ¿Ya tenés cuenta? <a href="/login" className="text-gold-500 hover:text-gold-400 underline">Iniciar sesión</a>
                </p>
            </div>
        </div>
    );
}

export default function ActivarCuentaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="text-gold-400 font-bold uppercase tracking-widest animate-pulse">
                    Cargando...
                </div>
            </div>
        }>
            <ActivarCuentaContent />
        </Suspense>
    );
}
