"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaStar, FaHistory, FaStickyNote, FaPhone, FaEnvelope, FaCircleNotch, FaCalendarAlt, FaTrash, FaChair, FaMoneyBillWave } from "react-icons/fa";
import { UserProfile } from "@/src/types";
import { db } from "@/src/lib/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, addDoc, deleteDoc, orderBy, getDoc, limit, QuerySnapshot, DocumentData } from "firebase/firestore";
import { formatDate } from "@/src/lib/utils/format";

interface UserSlideOverProps {
    user: UserProfile | null;
    onClose: () => void;
    onSuccess?: () => void;
}

interface VisitHistory {
    id: string;
    date: string;
    event: string;
    spent: number;
    seats: string[];
}

export default function UserSlideOver({ user, onClose, onSuccess }: UserSlideOverProps) {
    const isNew = !user;
    const [isEditing, setIsEditing] = useState(isNew);
    const [history, setHistory] = useState<VisitHistory[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        nombre: user?.nombre || "",
        apellido: user?.apellido || "",
        email: user?.email || "",
        telefono: user?.telefono || "",
        dni: user?.dni || "",
        direccion: user?.direccion || "",
        provincia: user?.provincia || "",
        fecha_nacimiento: user?.fecha_nacimiento ?
            (user.fecha_nacimiento instanceof Timestamp ?
                user.fecha_nacimiento.toDate().toISOString().split('T')[0] :
                user.fecha_nacimiento) : "",
        nivel_cliente: user?.nivel_cliente || "Bronce",
        points: user?.points || 0,
        notas_internas: user?.notas_internas || ""
    });

    useEffect(() => {
        const fetchFullUserProfile = async () => {
            if (user) {
                // Initial load from props (partial data potentially)
                setFormData(prev => ({
                    ...prev,
                    nombre: user.nombre || prev.nombre,
                    apellido: user.apellido || prev.apellido,
                    email: user.email || prev.email,
                    // Only overwrite if present in props, otherwise keep default/empty until fetch
                    level_cliente: user.nivel_cliente || prev.nivel_cliente,
                    points: user.points || prev.points,
                }));
                setIsEditing(false);

                // Fetch FULL profile to ensure consistent data (fixes Insights vs CRM discrepancy)
                if (user.uid) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        if (userDoc.exists()) {
                            const fullData = userDoc.data() as UserProfile;
                            setFormData({
                                nombre: fullData.nombre || "",
                                apellido: fullData.apellido || "",
                                email: fullData.email || "",
                                telefono: fullData.telefono || "",
                                dni: fullData.dni || "",
                                direccion: fullData.direccion || "",
                                provincia: fullData.provincia || "",
                                fecha_nacimiento: fullData.fecha_nacimiento ?
                                    (fullData.fecha_nacimiento instanceof Timestamp ?
                                        fullData.fecha_nacimiento.toDate().toISOString().split('T')[0] :
                                        fullData.fecha_nacimiento) : "",
                                nivel_cliente: fullData.nivel_cliente || "Bronce",
                                points: fullData.points || 0,
                                notas_internas: fullData.notas_internas || ""
                            });

                            // Update Totals from Document (Source of Truth)
                            if (fullData.totalSpent !== undefined) {
                                setTotalSpent(fullData.totalSpent);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching full profile:", error);
                    }
                }
            } else {
                setIsEditing(true);
                setHistory([]);
                setTotalSpent(0);

                setFormData({
                    nombre: "", apellido: "", email: "", telefono: "", dni: "",
                    direccion: "", provincia: "", fecha_nacimiento: "",
                    nivel_cliente: "Bronce", points: 0, notas_internas: ""
                });
            }
        };

        fetchFullUserProfile();
    }, [user]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.uid) return;
            setLoadingHistory(true);

            try {
                // NEW STRATEGY: Read from Subcollection (users/{uid}/visits)
                // specific to this user, reliable and fast.
                const visitsRef = collection(db, "users", user.uid, "visits");
                // Order by reservation creation time (newest first)
                const q = query(visitsRef, orderBy("createdAt", "desc"));

                const snap = await getDocs(q);

                const historyData = snap.docs.map(doc => {
                    const d = doc.data();

                    // Format Date to DD/MM/AAAA
                    let dateDisplay = d.date || "Fecha N/A";
                    if (dateDisplay.includes("-")) {
                        const [year, month, day] = dateDisplay.split("-");
                        if (year.length === 4) {
                            dateDisplay = `${day}/${month}/${year}`;
                        }
                    } else if (dateDisplay === "Fecha del Evento" && d.createdAt) {
                        // Fallback for the bugged manual entries: use created date
                        dateDisplay = formatDate(d.createdAt); // formatDate is DD/MM/YYYY usually? Let's check imports or assume utils.
                        // Actually formatDate in utils/format usually returns DD/MM/YYYY. 
                        // Let imports check: import { formatDate } from "@/src/lib/utils/format"; is present.
                    }

                    return {
                        id: doc.id,
                        event: d.eventName || "Evento",
                        date: dateDisplay,
                        spent: d.amount || 0,
                        seats: d.seats || []
                    };
                });

                setHistory(historyData);

                // Update Total Spent from Profile if available, else calc
                if (typeof user.totalSpent === 'number') {
                    setTotalSpent(user.totalSpent);
                } else {
                    const fallbackTotal = historyData.reduce((sum, h) => sum + (h.spent || 0), 0);
                    setTotalSpent(fallbackTotal);
                }

            } catch (err) {
                console.error("Error fetching visit history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [user?.uid]);

    const handleDelete = async () => {
        if (!user?.uid) return;
        if (!window.confirm("⚠️ ¿Eliminar cliente? acción irreversible.")) return;

        setSaving(true);
        try {
            await deleteDoc(doc(db, "users", user.uid));
            onSuccess?.();
            onClose();
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
                fecha_nacimiento: formData.fecha_nacimiento ? Timestamp.fromDate(new Date(formData.fecha_nacimiento)) : null,
                updatedAt: Timestamp.now()
            };

            if (isNew) {
                await addDoc(collection(db, "users"), {
                    ...dataToSave,
                    createdAt: Timestamp.now(),
                    role: "user"
                });
            } else {
                if (user?.uid) {
                    await updateDoc(doc(db, "users", user.uid), dataToSave);
                }
            }
            onSuccess?.();
            onClose();
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-stone-800/50 z-50 shadow-2xl animate-slide-in-right overflow-y-auto">
                <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md p-6 border-b border-stone-800/50 flex items-center justify-between z-10">
                    <h2 className="text-xl font-serif font-bold text-white">
                        {isNew ? "Nuevo Cliente" : isEditing ? "Editar Cliente" : "Ficha de Cliente"}
                    </h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                            >
                                Editar
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-stone-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Profile Header / Edit Form */}
                    <div className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Apellido</label>
                                        <input
                                            type="text"
                                            value={formData.apellido}
                                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Teléfono</label>
                                        <input
                                            type="tel"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">DNI</label>
                                        <input
                                            type="text"
                                            value={formData.dni}
                                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Dirección</label>
                                    <input
                                        type="text"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Provincia</label>
                                        <input
                                            type="text"
                                            value={formData.provincia}
                                            onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_nacimiento}
                                            onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg px-3 py-2 text-white focus:border-bargoglio-orange/50 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-bargoglio-orange to-amber-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/10 shadow-lg shadow-orange-900/40">
                                    {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">
                                        {user?.nombre} {user?.apellido}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${user?.nivel_cliente === "Oro"
                                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                            : user?.nivel_cliente === "Plata"
                                                ? "bg-gray-400/20 text-gray-300 border border-gray-400/30"
                                                : "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                                            }`}>
                                            Nivel {user?.nivel_cliente || "Bronce"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats & Info */}
                    {!isEditing && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-bargoglio-orange/10 to-transparent p-4 rounded-xl border border-bargoglio-orange/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaStar className="w-3 h-3 text-bargoglio-orange" />
                                        <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Puntos</h4>
                                    </div>
                                    <p className="text-2xl font-bold text-bargoglio-orange">
                                        {user?.points?.toLocaleString() || 0}
                                    </p>
                                </div>
                                <div className="bg-stone-900/50 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaMoneyBillWave className="w-3 h-3 text-green-400" />
                                        <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Total Gastado</h4>
                                    </div>
                                    <p className="text-2xl font-bold text-green-400">
                                        ${totalSpent.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 py-4 border-y border-stone-800/50">
                                <div className="flex items-center gap-3 text-stone-400">
                                    <FaEnvelope className="w-3.5 h-3.5" />
                                    <span className="text-sm">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-stone-400">
                                    <FaPhone className="w-3.5 h-3.5" />
                                    <span className="text-sm">{user?.telefono || "Sin teléfono"}</span>
                                </div>
                                {user?.fecha_nacimiento && (
                                    <div className="flex items-center gap-3 text-stone-400">
                                        <FaCalendarAlt className="w-3.5 h-3.5" />
                                        <span className="text-sm">
                                            {formatDate(
                                                user.fecha_nacimiento instanceof Timestamp
                                                    ? user.fecha_nacimiento.toDate().toISOString().split('T')[0]
                                                    : user.fecha_nacimiento
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Staff Notes */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FaStickyNote className="w-3 h-3 text-bargoglio-orange" />
                            <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Notas del Staff</h4>
                        </div>
                        <textarea
                            value={formData.notas_internas}
                            onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
                            placeholder="Agregar notas sobre el cliente..."
                            className="w-full h-24 bg-[#1a1a1a] border border-stone-800 rounded-lg p-3 text-stone-300 placeholder-stone-700 text-sm focus:border-bargoglio-orange/50 outline-none resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => isNew ? onClose() : setIsEditing(false)}
                                    className="flex-1 py-3 border border-stone-800 text-stone-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-bargoglio-orange text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 shadow-lg shadow-bargoglio-orange/20"
                                >
                                    {saving ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={saving || formData.notas_internas === user?.notas_internas}
                                className="w-full py-3 bg-stone-800 text-stone-300 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-stone-700"
                            >
                                {saving ? "Guardando..." : "Actualizar Notas"}
                            </button>
                        )}
                    </div>

                    {/* History */}
                    {!isNew && !isEditing && (
                        <div className="space-y-4 pt-6 border-t border-stone-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaHistory className="w-3 h-3 text-bargoglio-orange" />
                                    <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">Historial de Visitas</h4>
                                </div>
                                <span className="text-stone-500 text-[10px]">{history.length} visitas</span>
                            </div>

                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-4">
                                        <FaCircleNotch className="animate-spin text-stone-600" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-stone-600 text-xs italic">Sin historial registrado.</p>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-stone-800/50 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-white font-bold text-sm">{item.event}</p>
                                                    <p className="text-stone-500 text-xs">{item.date}</p>
                                                </div>
                                                <p className="text-green-400 font-mono font-bold text-sm">${item.spent.toLocaleString()}</p>
                                            </div>
                                            {item.seats.length > 0 && (
                                                <div className="flex items-center gap-2 text-stone-600 text-[10px] uppercase tracking-wider">
                                                    <FaChair className="w-2.5 h-2.5" />
                                                    {item.seats.map(s => s.replace("mesa-", "Mesa ").replace("barra-", "Barra ")).join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                }
            `}</style>
        </>
    );
}
