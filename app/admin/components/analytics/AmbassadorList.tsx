"use client";
import { FaCrown, FaEnvelope, FaEye } from "react-icons/fa";

interface Ambassador {
    id: string;
    name: string;
    points: number;
    email: string;
    visitCount?: number;
    favoriteGenre?: string;
}

interface AmbassadorListProps {
    users: Ambassador[];
    onSelectUser?: (user: any) => void;
}

export default function AmbassadorList({ users, onSelectUser }: AmbassadorListProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg h-full">
            <h3 className="text-white font-serif font-bold mb-6 flex items-center gap-2">
                <FaCrown className="text-gold-400" />
                Embajadores de Bargoglio
            </h3>

            {/* Header Row */}
            <div className="flex text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-3 px-3">
                <div className="w-10 text-center">#</div>
                <div className="flex-1">Cliente</div>
                <div className="w-16 text-center">Visitas</div>
                <div className="w-16 text-right">Puntos</div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {users.map((user, idx) => (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser && onSelectUser({ uid: user.id, ...user, nombre: user.name.split(' ')[0], apellido: user.name.split(' ').slice(1).join(' ') || '' })}
                        className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${idx === 0 ? 'bg-gold-500 text-black' : 'bg-stone-800 text-stone-400'}`}>
                                {idx + 1}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm group-hover:text-gold-400 transition-colors">{user.name}</p>
                            </div>
                        </div>

                        <div className="w-16 text-center text-stone-300 font-medium text-sm">
                            {user.visitCount || 0}
                        </div>

                        <div className="w-16 text-right font-bold text-gold-500 text-sm">
                            {user.points}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
