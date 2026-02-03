"use client";

import { FaBirthdayCake, FaGift } from "react-icons/fa";

interface Birthday {
    uid: string;
    nombre: string;
    apellido: string;
    fecha: string;
}

interface BirthdayWidgetProps {
    birthdays: Birthday[];
}

export default function BirthdayWidget({ birthdays }: BirthdayWidgetProps) {
    if (birthdays.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <FaBirthdayCake className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-semibold text-white">Cumpleaños Esta Semana</h3>
            </div>

            <div className="flex flex-wrap gap-4">
                {birthdays.map((birthday) => (
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
            </div>
        </div>
    );
}
