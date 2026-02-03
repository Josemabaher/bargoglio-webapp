"use client";

import { useState, useEffect } from "react";
import { FaUtensils } from "react-icons/fa6";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

export default function MenuSection() {
    // Default fallback URL
    const DEFAULT_MENU_URL = "https://res.cloudinary.com/demo/image/upload/v1/bargoglio/menu.pdf";
    const [menuUrl, setMenuUrl] = useState(DEFAULT_MENU_URL);

    // Load menu URL from Firestore config
    useEffect(() => {
        const loadMenuUrl = async () => {
            try {
                const configDoc = await getDoc(doc(db, 'config', 'menu'));
                if (configDoc.exists() && configDoc.data().url) {
                    setMenuUrl(configDoc.data().url);
                }
            } catch (e) {
                console.error("Error loading menu URL:", e);
            }
        };
        loadMenuUrl();
    }, []);

    return (
        <section id="menu" className="py-24 relative overflow-hidden">
            {/* Background with texture */}
            <div className="absolute inset-0 bg-stone-950">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
                {/* Gold Abstract Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-velvet-900/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Left: Text Content */}
                    <div className="text-center md:text-left z-10">
                        <span className="text-gold-400 font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
                            Gastronomía
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                            Una Experiencia <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-600">
                                Para los Sentidos
                            </span>
                        </h2>
                        <p className="text-stone-300 text-lg mb-8 leading-relaxed max-w-xl mx-auto md:mx-0 font-light">
                            Nuestra carta está diseñada para acompañar la música. Disfrutá de una selección exclusiva de vinos y de platos principales.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                            <a
                                href={menuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative px-8 py-4 bg-transparent border border-gold-500 text-gold-400 font-bold uppercase tracking-widest overflow-hidden transition-all duration-300 hover:text-charcoal-900 hover:border-gold-400"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gold-500 transform -translate-x-full transition-transform duration-300 group-hover:translate-x-0"></span>
                                <span className="relative z-10 flex items-center gap-3">
                                    <FaUtensils className="text-sm" />
                                    Ver Menú Completo
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Right: Visual Features */}
                    <div className="relative h-[500px] w-full hidden md:block group perspective-1000">
                        {/* Card 1: Cocktails */}
                        <div className="absolute top-0 right-10 w-2/3 h-80 bg-stone-900 rounded-xl overflow-hidden shadow-2xl transform rotate-3 transition-transform duration-700 hover:rotate-0 hover:z-20 hover:scale-105 border border-white/5">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent">
                                <h3 className="text-2xl font-serif text-gold-400">Coctelería de Autor</h3>
                            </div>
                        </div>

                        {/* Card 2: Food */}
                        <div className="absolute bottom-0 left-10 w-2/3 h-80 bg-stone-900 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transform -rotate-3 translate-x-4 transition-transform duration-700 hover:rotate-0 hover:z-20 hover:scale-105 border border-white/5 z-10">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent">
                                <h3 className="text-2xl font-serif text-gold-400">Tapas & Jazz</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
