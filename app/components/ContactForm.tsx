"use client";

import { useState } from "react";

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");

        // Simulate sending email
        console.log("Sending email to info@bargoglio.com.ar", formData);

        // TODO: Implement actual email sending logic (e.g., via API route using Resend)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-charcoal-900/80 p-8 rounded-xl border border-white/5 backdrop-blur-sm">
            <p className="text-stone-400 text-center mb-8">
                ¿Tenés alguna consulta? Escribinos y te responderemos a la brevedad.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-xs uppercase tracking-widest text-white font-bold">
                            Tu Nombre
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-charcoal-800 border border-white/10 rounded-lg px-4 py-3 text-stone-200 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
                            placeholder="Juan Pérez"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs uppercase tracking-widest text-white font-bold">
                            Tu Correo Electrónico
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-charcoal-800 border border-white/10 rounded-lg px-4 py-3 text-stone-200 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
                            placeholder="juan@ejemplo.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs uppercase tracking-widest text-white font-bold">
                        Tu Teléfono
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-charcoal-800 border border-white/10 rounded-lg px-4 py-3 text-stone-200 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all"
                        placeholder="+54 11 1234 5678"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="message" className="text-xs uppercase tracking-widest text-white font-bold">
                        Tu Mensaje
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full bg-charcoal-800 border border-white/10 rounded-lg px-4 py-3 text-stone-200 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all resize-none"
                        placeholder="Escribí tu mensaje aquí..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === "submitting" || status === "success"}
                    className={`w-full py-4 text-stone-100 font-bold uppercase tracking-[0.2em] rounded-lg transition-all duration-300 shadow-lg ${status === "success"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-bargoglio-red hover:bg-[#8a1612] hover:shadow-red-900/40"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                    {status === "submitting"
                        ? "Enviando..."
                        : status === "success"
                            ? "¡Mensaje Enviado!"
                            : "Enviar Mensaje"}
                </button>
            </form>
        </div>
    );
}
