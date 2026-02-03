import { FaStar, FaGift, FaExchangeAlt } from "react-icons/fa";

const pointsStats = [
    { label: "Total Puntos Emitidos", value: "245,800", icon: FaStar },
    { label: "Puntos Canjeados", value: "89,200", icon: FaExchangeAlt },
    { label: "Regalos Enviados", value: "156", icon: FaGift },
];

const recentActivity = [
    { client: "Juan Pérez", action: "Acumuló 8 pts", date: "Hace 2 horas" },
    { client: "María García", action: "Canjeó 500 pts", date: "Hace 5 horas" },
    { client: "Carlos López", action: "Acumuló 12 pts", date: "Ayer" },
];

export default function PointsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-white">Sistema de Puntos</h1>
                <p className="text-stone-500 mt-1">Gestión del programa de fidelización (1 punto = $1,000).</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pointsStats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-bargoglio-orange/20">
                                <stat.icon className="w-6 h-6 text-bargoglio-orange" />
                            </div>
                            <div>
                                <p className="text-stone-500 text-sm">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
                <div className="space-y-3">
                    {recentActivity.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between py-3 border-b border-stone-800/30 last:border-0"
                        >
                            <div>
                                <p className="text-white font-medium">{item.client}</p>
                                <p className="text-stone-500 text-sm">{item.action}</p>
                            </div>
                            <p className="text-stone-600 text-sm">{item.date}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
