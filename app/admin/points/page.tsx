"use client";

import { useState, useEffect } from "react";
import { FaStar, FaGift, FaExchangeAlt, FaCog, FaSave, FaCircleNotch } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase/config";
import { useSettings } from "@/src/hooks/useSettings";

export default function PointsPage() {
    const { settings, loading: settingsLoading, updatePointsRatio } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [newRatio, setNewRatio] = useState<string>("");
    
    // Dynamic Data States
    const [stats, setStats] = useState({ totalPoints: 0, redeemedPoints: 0, giftsSent: 0 });
    const [activity, setActivity] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchPointsData = async () => {
            try {
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);
                let total = 0;
                let userList: any[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const pts = data.points || 0;
                    if (pts > 0) {
                        total += pts;
                        userList.push({
                            id: doc.id,
                            name: data.nombre ? `${data.nombre} ${data.apellido || ''}`.trim() : 'Usuario',
                            points: pts,
                            updatedAt: data.updatedAt?.toMillis() || Date.now()
                        });
                    }
                });

                setStats({
                    totalPoints: total,
                    redeemedPoints: 0, // En un futuro, implementar ledger de canjes
                    giftsSent: 0 // Placeholder
                });

                // Ordenar por última actualización
                userList.sort((a, b) => b.updatedAt - a.updatedAt);
                
                const recent = userList.slice(0, 10).map(u => ({
                    id: u.id,
                    client: u.name,
                    action: `Tiene ${u.points.toLocaleString()} pts acumulados`,
                    date: new Date(u.updatedAt).toLocaleDateString('es-AR')
                }));

                setActivity(recent);
            } catch (err) {
                console.error("Error fetching points data", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchPointsData();
    }, []);

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

    const pointsStatsUi = [
        { label: "Puntos Activos (Total Clientes)", value: stats.totalPoints.toLocaleString(), icon: FaStar },
        { label: "Puntos Canjeados (Próximamente)", value: stats.redeemedPoints.toLocaleString(), icon: FaExchangeAlt },
        { label: "Regalos Enviados (Próximamente)", value: stats.giftsSent.toLocaleString(), icon: FaGift },
    ];

    if (settingsLoading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gold-400">
                <FaCircleNotch className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
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
                    {!isEditing ? (
                        <>
                            <div className="text-3xl font-bold text-white">
                                $ {settings.pesosPerPoint.toLocaleString()} <span className="text-sm font-normal text-stone-500">= 1 Punto</span>
                            </div>
                            <button
                                onClick={handleStartEdit}
                                className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 transition font-bold"
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
                                className="ml-2 p-3 bg-green-600/20 text-green-500 rounded hover:bg-green-600 hover:text-white transition-colors"
                                title="Guardar"
                            >
                                <FaSave />
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-3 bg-red-900/20 text-red-500 rounded hover:bg-red-900 hover:text-white transition-colors"
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
                {pointsStatsUi.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 hover:bg-stone-900 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-bargoglio-orange/20">
                                <stat.icon className="w-6 h-6 text-bargoglio-orange" />
                            </div>
                            <div>
                                <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Clientes con Puntos</h3>
                {activity.length > 0 ? (
                    <div className="space-y-3">
                        {activity.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between py-3 border-b border-stone-800/30 last:border-0"
                            >
                                <div>
                                    <p className="text-white font-medium">{item.client}</p>
                                    <p className="text-gold-400 text-sm">{item.action}</p>
                                </div>
                                <p className="text-stone-600 text-sm bg-stone-900 px-3 py-1 rounded">Última act: {item.date}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-500 text-center py-4">No hay clientes con puntos acumulados aún.</p>
                )}
            </div>
        </div>
    );
}

