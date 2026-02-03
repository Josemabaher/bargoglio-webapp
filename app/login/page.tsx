"use client";

import { useState } from "react";
import { loginWithGoogle, signInWithEmailAndPassword } from "@/src/lib/firebase/auth";
import { auth } from "@/src/lib/firebase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaGoogle, FaEnvelope, FaLock, FaArrowRight, FaCircleNotch } from "react-icons/fa";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("Email o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const user = await loginWithGoogle();

            // Check if user exists in Firestore, if not create it
            const { doc, getDoc, setDoc, Timestamp } = await import("firebase/firestore");
            const { db } = await import("@/src/lib/firebase/config");

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    nombre: user.displayName?.split(" ")[0] || "Usuario",
                    apellido: user.displayName?.split(" ").slice(1).join(" ") || "",
                    email: user.email,
                    telefono: user.phoneNumber || "",
                    fecha_nacimiento: null, // Google doesn't provide this easily
                    photoURL: user.photoURL,
                    points: 0,
                    nivel_cliente: "Bronce",
                    role: "user",
                    createdAt: Timestamp.now(),
                    uid: user.uid,
                    authProvider: "google"
                });
            }

            router.push("/");
        } catch (err) {
            console.error(err);
            setError("Error al iniciar sesión con Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_#A11A1620_0%,_transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,_#A11A1620_0%,_transparent_50%)]"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <Image
                            src="/Bargoglio-Logo-Circulo-Transparente-02.png"
                            alt="Bargoglio"
                            width={80}
                            height={80}
                            className="hover:rotate-12 transition-transform duration-500"
                        />
                    </Link>
                </div>

                <div className="bg-[#121212]/80 backdrop-blur-xl border border-stone-800/50 rounded-2xl shadow-2xl overflow-hidden p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Bienvenido</h1>
                        <p className="text-stone-500 text-sm">Ingresá a tu cuenta exclusiva de Bargoglio</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Email</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                    placeholder="tu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Contraseña</label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-bargoglio-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <FaCircleNotch className="animate-spin" /> : <>Ingresar <FaArrowRight /></>}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#121212] px-4 text-stone-500 tracking-widest">O continuar con</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-stone-900 font-bold py-3 px-6 rounded-xl hover:bg-stone-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <FaGoogle className="text-red-500" /> Google
                    </button>

                    <div className="mt-8 text-center text-sm text-stone-500">
                        ¿No tenés cuenta?{" "}
                        <Link href="/registro" className="text-bargoglio-red hover:underline font-bold">
                            Registrate ahora
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
