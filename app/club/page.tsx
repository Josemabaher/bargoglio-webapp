"use client";

import Navbar from "../components/Navbar";
import { FaStar, FaBirthdayCake, FaTicketAlt, FaWineGlass, FaCrown, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export default function ClubPage() {
    return (
        <main className="min-h-screen bg-black text-stone-200">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                <Image
                    src="/club-hero.png"
                    alt="Club Bargoglio Atmosphere"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-wide drop-shadow-2xl">
                        CLUB <span className="text-bargoglio-red">BARGOGLIO</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-stone-300 max-w-2xl font-light tracking-widest uppercase mb-10">
                        Más que un club de jazz,<br />una comunidad de amantes del buen vivir.
                    </p>
                    <Link
                        href="/registro"
                        className="px-10 py-4 bg-bargoglio-red text-white text-sm font-bold uppercase tracking-[0.2em] rounded-full hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(161,26,22,0.5)] hover:scale-105 hover:shadow-[0_0_50px_rgba(161,26,22,0.8)] flex items-center gap-4 group"
                    >
                        Unirme Ahora <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Introduction */}
            <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto text-center border-b border-white/5">
                <FaCrown className="w-12 h-12 text-bargoglio-red mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                    Beneficios Exclusivos
                </h2>
                <p className="text-stone-400 leading-relaxed text-lg max-w-3xl mx-auto">
                    Ser miembro del Club Bargoglio es acceder a una experiencia superior.
                    Diseñado para premiar tu fidelidad y pasión por la música, nuestro programa te brinda
                    ventajas únicas desde tu primera visita.
                </p>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Benefit 1 */}
                        <div className="bg-[#121212] p-8 rounded-2xl border border-white/5 hover:border-bargoglio-red/30 transition-colors group relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-bargoglio-red/5 rounded-full blur-2xl group-hover:bg-bargoglio-red/10 transition-colors"></div>
                            <div className="w-12 h-12 bg-bargoglio-red/10 rounded-xl flex items-center justify-center text-bargoglio-red mb-6 group-hover:scale-110 transition-transform">
                                <FaStar className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Puntos Por Consumo</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">
                                Acumulá puntos con cada reserva y consumo. Canjealos por descuentos directos en tus próximas noches de jazz.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="bg-[#121212] p-8 rounded-2xl border border-white/5 hover:border-bargoglio-red/30 transition-colors group relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
                            <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                <FaBirthdayCake className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Regalo de Cumpleaños</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">
                                ¡Festejamos con vos! Disfrutá de beneficios especiales en tu semana de cumpleaños, como 2x1 en entradas o brindis de cortesía.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="bg-[#121212] p-8 rounded-2xl border border-white/5 hover:border-bargoglio-red/30 transition-colors group relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                            <div className="w-12 h-12 bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                                <FaTicketAlt className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Acceso Prioritario</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">
                                Enterate antes que nadie de nuestra agenda y accedé a la preventa exclusiva para shows internacionales y noches especiales.
                            </p>
                        </div>

                        {/* Benefit 4 */}
                        <div className="bg-[#121212] p-8 rounded-2xl border border-white/5 hover:border-bargoglio-red/30 transition-colors group relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
                            <div className="w-12 h-12 bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                                <FaWineGlass className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Experiencias VIP</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">
                                Invitaciones a catas privadas, jams sessions a puerta cerrada y eventos exclusivos solo para socios del club.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tiers Section */}
            <section className="py-20 border-b border-t border-white/5 bg-black">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-bold text-white mb-4">Niveles de Membresía</h2>
                        <p className="text-stone-500">Tu lealtad desbloquea nuevas recompensas</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Bronce */}
                        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-amber-900/30 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-amber-800"></div>
                            <h3 className="text-2xl font-bold text-amber-700 mb-2 mt-4 uppercase tracking-widest">Bronce</h3>
                            <p className="text-xs text-stone-500 mb-8 uppercase tracking-wider">Nivel Inicial</p>
                            <ul className="space-y-4 text-stone-400 text-sm mb-8 flex-1">
                                <li>✓ Acumulación de Puntos</li>
                                <li>✓ Newsletter Semanal</li>
                                <li>✓ Acceso a Reservas Online</li>
                            </ul>
                        </div>

                        {/* Plata */}
                        <div className="bg-gradient-to-b from-[#252525] to-[#121212] border border-stone-400/30 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group scale-105 shadow-2xl z-10">
                            <div className="absolute top-0 inset-x-0 h-1 bg-stone-300"></div>
                            <h3 className="text-2xl font-bold text-stone-300 mb-2 mt-4 uppercase tracking-widest">Plata</h3>
                            <p className="text-xs text-stone-500 mb-8 uppercase tracking-wider">5.000+ Puntos</p>
                            <ul className="space-y-4 text-stone-300 text-sm mb-8 flex-1 font-medium">
                                <li>✓ Todo lo de Bronce</li>
                                <li>✓ <strong>Beneficio Cumpleaños</strong></li>
                                <li>✓ 5% OFF en Carta de Vinos</li>
                                <li>✓ Prioridad en Lista de Espera</li>
                            </ul>
                        </div>

                        {/* Oro */}
                        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-yellow-600/30 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-yellow-500"></div>
                            <h3 className="text-2xl font-bold text-yellow-500 mb-2 mt-4 uppercase tracking-widest">Oro</h3>
                            <p className="text-xs text-stone-500 mb-8 uppercase tracking-wider">15.000+ Puntos</p>
                            <ul className="space-y-4 text-stone-400 text-sm mb-8 flex-1">
                                <li>✓ Todo lo de Plata</li>
                                <li>✓ <strong>10% OFF en Entradas</strong></li>
                                <li>✓ Invitaciones a Eventos Privados</li>
                                <li>✓ Mesa Preferencial Asegurada</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-24 px-4 text-center bg-[#121212] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#A11A1610_0%,_transparent_60%)]"></div>

                <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-8 relative z-10">
                    ¿Estás listo para ser parte?
                </h2>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                    <Link
                        href="/registro"
                        className="px-12 py-5 bg-bargoglio-red text-white font-bold uppercase tracking-[0.2em] rounded-full hover:bg-red-700 transition-all shadow-2xl hover:scale-105"
                    >
                        Quiero Unirme
                    </Link>
                    <Link
                        href="/login"
                        className="px-12 py-5 bg-transparent border border-white/20 text-white font-bold uppercase tracking-[0.2em] rounded-full hover:bg-white/5 transition-all"
                    >
                        Ya tengo cuenta
                    </Link>
                </div>
            </section>
        </main>
    );
}
