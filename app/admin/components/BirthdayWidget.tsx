"use client";

import { useState } from "react";
import Link from "next/link";
import { FaBirthdayCake, FaGift } from "react-icons/fa";

interface Birthday {
    uid: string;
    nombre: string;
    apellido: string;
    fecha: string;
    email?: string;
}

interface BirthdayWidgetProps {
    birthdays: Birthday[];
    limit?: number;
}

export default function BirthdayWidget({ birthdays, limit = 100 }: BirthdayWidgetProps) {
    const [showModal, setShowModal] = useState(false);
    if (birthdays.length === 0) return null;

    const displayedBirthdays = birthdays.slice(0, limit);
    const hasMore = birthdays.length > limit;

    return (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <FaBirthdayCake className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-semibold text-white">Cumpleaños Esta Semana</h3>
            </div>

            <div className="flex flex-wrap gap-4">
                {displayedBirthdays.map((birthday) => (
                    <div
                        key={birthday.uid}
                        className="flex items-center gap-3 bg-[#1a1a1a]/50 border border-white/10 rounded-lg px-4 py-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {birthday.nombre.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white font-medium">
                                {birthday.nombre} {birthday.apellido}
                            </p>
                            <p className="text-stone-400 text-sm">{birthday.fecha}</p>
                        </div>
                        <button
                            className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-bargoglio-orange/20 text-bargoglio-orange rounded-lg text-sm font-medium hover:bg-bargoglio-orange hover:text-white transition-colors"
                        >
                            <FaGift className="w-3 h-3" />
                            Enviar Regalo
                        </button>
                    </div>
                ))}

                {hasMore && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="font-bold text-sm">+{birthdays.length - limit} VER MÁS</span>
                    </button>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-[#1a1a1a] w-full max-w-3xl rounded-2xl border border-stone-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FaBirthdayCake className="text-pink-500" /> Próximos Cumpleaños
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-white">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            {birthdays.map((birthday) => (
                                <div
                                    key={birthday.uid}
                                    className="flex items-center justify-between bg-stone-900/50 p-4 rounded-xl border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {birthday.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {birthday.nombre} {birthday.apellido}
                                            </p>
                                            <p className="text-stone-400 text-sm">{birthday.fecha}</p>
                                        </div>
                                    </div>
                                    <Link href={`/admin/crm?search=${birthday.email || birthday.nombre}`} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                        Ver Perfil
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
