"use client";

import { useState } from "react";
import { FaStar, FaGift, FaExchangeAlt, FaCog, FaSave } from "react-icons/fa";
import { useSettings } from "@/src/hooks/useSettings";

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
    const { settings, loading, updatePointsRatio } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [newRatio, setNewRatio] = useState<string>("");

    const handleStartEdit = () => {
        setNewRatio(settings.pesosPerPoint.toString());
        setIsEditing(true);
    };

    const handleSave = async () => {
        const val = parseFloat(newRatio);
        if (!isNaN(val) && val > 0) {
            const success = await updatePointsRatio(val);
            if (success) {
                setIsEditing(false);
            } else {
                alert("Error al guardar la configuración.");
            }
        } else {
            alert("Por favor ingrese un valor válido mayor a 0.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-white">Sistema de Puntos</h1>
                <p className="text-stone-500 mt-1">Gestión del programa de fidelización.</p>
            </div>

            {/* Config Card */}
            <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 hover:border-bargoglio-orange/50 transition-all">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FaCog className="text-stone-400" /> Configuración de Canje
                        </h3>
                        <p className="text-stone-500 text-sm mt-1">
                            Define cuántos pesos equivalen a 1 punto.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                    {loading ? (
                        <p className="text-stone-500">Cargando...</p>
                    ) : !isEditing ? (
                        <>
                            <div className="text-3xl font-bold text-white">
                                $ {settings.pesosPerPoint.toLocaleString()} <span className="text-sm font-normal text-stone-500">= 1 Punto</span>
                            </div>
                            <button
                                onClick={handleStartEdit}
                                className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 transition"
                            >
                                Editar
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <span className="text-2xl font-bold text-stone-400">$</span>
                            <input
                                type="number"
                                value={newRatio}
                                onChange={(e) => setNewRatio(e.target.value)}
                                className="bg-black border border-stone-600 rounded p-2 text-white text-xl w-32 focus:border-bargoglio-orange outline-none"
                                autoFocus
                            />
                            <span className="text-stone-400">= 1 Punto</span>

                            <button
                                onClick={handleSave}
                                className="ml-2 p-2 bg-green-600 text-white rounded hover:bg-green-500"
                                title="Guardar"
                            >
                                <FaSave />
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 bg-red-900/50 text-red-200 border border-red-900 rounded hover:bg-red-900"
                                title="Cancelar"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
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
