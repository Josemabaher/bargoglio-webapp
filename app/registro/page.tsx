"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "@/src/lib/firebase/auth";
import { auth, db } from "@/src/lib/firebase/config";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaBirthdayCake, FaArrowRight, FaCircleNotch } from "react-icons/fa";
import Image from "next/image";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        password: "",
        fecha_nacimiento: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            // Create combined record for CRM and User Management
            await setDoc(doc(db, "users", user.uid), {
                nombre: formData.nombre,
                apellido: formData.apellido,
                email: formData.email,
                telefono: formData.telefono,
                fecha_nacimiento: formData.fecha_nacimiento ? Timestamp.fromDate(new Date(formData.fecha_nacimiento)) : null,
                points: 0,
                nivel_cliente: "Bronce",
                role: "user",
                createdAt: Timestamp.now(),
                uid: user.uid
            });

            router.push("/perfil");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("El email ya está registrado");
            } else {
                setError("Ocurrió un error al crear la cuenta");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden py-12">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_#A11A1620_0%,_transparent_50%)]"></div>

            <div className="w-full max-w-xl relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <Image
                            src="/Bargoglio-Logo-Circulo-Transparente-02.png"
                            alt="Bargoglio"
                            width={70}
                            height={70}
                            className="hover:rotate-12 transition-transform duration-500"
                        />
                    </Link>
                </div>

                <div className="bg-[#121212]/80 backdrop-blur-xl border border-stone-800/50 rounded-2xl shadow-2xl overflow-hidden p-8 md:p-10">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Unite al Club</h1>
                        <p className="text-stone-500 text-sm">Registrate para acumular puntos y beneficios exclusivos</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Nombre</label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                        placeholder="Juan"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Apellido</label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={formData.apellido}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                        placeholder="Pérez"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Email</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                    placeholder="tu@email.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Teléfono</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                    <input
                                        type="tel"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                        placeholder="11 1234-5678"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Nacimiento</label>
                                <div className="relative">
                                    <FaBirthdayCake className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                    <input
                                        type="date"
                                        name="fecha_nacimiento"
                                        value={formData.fecha_nacimiento}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                    />
                                </div>
                                <span className="text-[10px] text-stone-500 italic block mt-1">(es para darte regalos ese día)</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Contraseña</label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-bargoglio-red transition-colors"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-bargoglio-red hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <FaCircleNotch className="animate-spin" /> : <>Crear Mi Cuenta <FaArrowRight /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-stone-500">
                        ¿Ya sos socio?{" "}
                        <Link href="/login" className="text-bargoglio-red hover:underline font-bold">
                            Ingresá aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
