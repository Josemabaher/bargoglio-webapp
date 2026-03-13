'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/config';
import Image from 'next/image';

export default function AuthActionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [mode, setMode] = useState<string | null>(null);
    const [oobCode, setOobCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Read Firebase Auth query parameters
        const m = searchParams.get('mode');
        const code = searchParams.get('oobCode');
        
        setMode(m);
        setOobCode(code);

        if (m === 'resetPassword' && code) {
            // Verify the code and get the user's email
            verifyPasswordResetCode(auth, code)
                .then((userEmail) => {
                    setEmail(userEmail);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Link verification error:", err);
                    setError("El enlace de recuperación es inválido o ha expirado. Por favor, solicitá uno nuevo.");
                    setLoading(false);
                });
        } else {
            setError("Modo no soportado o enlace incompleto.");
            setLoading(false);
        }
    }, [searchParams]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (!oobCode) return;

        setSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess(true);
        } catch (err: any) {
            console.error("Reset error:", err);
            setError("Hubo un error al actualizar tu contraseña. Intenta nuevamente.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="text-gold-400 font-bold uppercase tracking-widest animate-pulse">
                    Validando enlace...
                </div>
            </div>
        );
    }

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
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#A11A16] to-transparent" />

                    {error ? (
                        <div className="text-center text-red-400 space-y-6">
                            <p>{error}</p>
                            <button 
                                onClick={() => router.push('/')}
                                className="px-6 py-2 border border-red-500/50 text-red-400 font-bold tracking-widest text-sm rounded hover:bg-red-500/10 transition-colors uppercase"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    ) : success ? (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-2">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl text-white font-serif uppercase tracking-wider">¡Contraseña Guardada!</h2>
                            <p className="text-stone-300 font-light leading-relaxed">
                                Tu nueva contraseña fue configurada exitosamente. Ya podés acceder a tu cuenta y ver tus Puntos en el Club.
                            </p>
                            <button 
                                onClick={() => router.push('/profile')}
                                className="w-full relative group overflow-hidden bg-[#A11A16] hover:bg-red-800 text-gold-200 py-3.5 px-6 rounded-lg font-bold tracking-[0.15em] text-sm transition-all duration-300 uppercase shadow-lg shadow-[#A11A16]/20 border border-gold-500/20"
                            >
                                <span className="relative z-10">IR A MI PERFIL</span>
                            </button>
                        </div>
                    ) : mode === 'resetPassword' ? (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl text-white font-serif uppercase tracking-wider mb-2">Activar Cuenta</h2>
                                <p className="text-stone-400 text-sm">Creá una contraseña segura para tu cuenta asociada al correo <strong className="text-gold-400 font-normal">{email}</strong>.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold block">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-stone-950/50 border border-white/10 rounded-lg p-3.5 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all placeholder:text-stone-700 font-mono"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold block">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-stone-950/50 border border-white/10 rounded-lg p-3.5 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all placeholder:text-stone-700 font-mono"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full relative group overflow-hidden bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 py-3.5 px-6 rounded-lg font-bold tracking-[0.15em] text-sm transition-all duration-300 uppercase mt-4 shadow-lg shadow-gold-500/20"
                                >
                                    <span className="relative z-10">
                                        {submitting ? 'Guardando...' : 'Guardar y Activar'}
                                    </span>
                                </button>
                            </form>
                        </div>
                    ) : (
                        <p className="text-white text-center">Cargando...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
