"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaStar, FaHistory, FaStickyNote, FaPhone, FaEnvelope, FaCircleNotch, FaCalendarAlt, FaTrash, FaChair, FaMoneyBillWave, FaUserEdit, FaSave, FaUser } from "react-icons/fa";
import { UserProfile } from "@/src/types";
import { db } from "@/src/lib/firebase/config";
import { collection, query, getDocs, doc, updateDoc, Timestamp, addDoc, deleteDoc, orderBy, getDoc } from "firebase/firestore";
import { formatDate } from "@/src/lib/utils/format";
import { getSeatDefinition } from "@/src/lib/data/seats";

interface ClientProfileDashboardProps {
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
    createdAt?: Timestamp;
}

export default function ClientProfileDashboard({ user, onClose, onSuccess }: ClientProfileDashboardProps) {
    const isNew = !user || !user.uid;
    const [isEditing, setIsEditing] = useState(isNew);
    const [history, setHistory] = useState<VisitHistory[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [visitCount, setVisitCount] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        nombre: user?.nombre || "",
        apellido: user?.apellido || "",
        email: user?.email || "",
        photoURL: user?.photoURL || "",
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
            if (user?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const fullData = userDoc.data() as UserProfile;
                        setFormData({
                            nombre: fullData.nombre || "",
                            apellido: fullData.apellido || "",
                            email: fullData.email || "",
                            photoURL: fullData.photoURL || "",
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
                        if (fullData.totalSpent !== undefined) setTotalSpent(fullData.totalSpent);
                        if (fullData.visitCount !== undefined) setVisitCount(fullData.visitCount);
                    }
                } catch (error) {
                    console.error("Error fetching full profile:", error);
                }
            } else if (isNew) {
                // Reset form for new user
                setFormData({
                    nombre: "", apellido: "", email: "", photoURL: "", telefono: "", dni: "",
                    direccion: "", provincia: "", fecha_nacimiento: "",
                    nivel_cliente: "Bronce", points: 0, notas_internas: ""
                });
                setTotalSpent(0);
                setVisitCount(0);
            }
        };

        fetchFullUserProfile();
    }, [user, isNew]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.uid) return;
            setLoadingHistory(true);

            try {
                // Read from Subcollection (users/{uid}/visits)
                const visitsRef = collection(db, "users", user.uid, "visits");
                const q = query(visitsRef, orderBy("createdAt", "desc"));

                const snap = await getDocs(q);

                const historyData = snap.docs.map(doc => {
                    const d = doc.data();

                    // Format Date
                    let dateDisplay = d.date || "Fecha N/A";
                    if (dateDisplay.includes("-")) {
                        const [year, month, day] = dateDisplay.split("-");
                        if (year.length === 4) dateDisplay = `${day}/${month}/${year}`;
                    } else if (dateDisplay === "Fecha del Evento" && d.createdAt) {
                        dateDisplay = formatDate(d.createdAt);
                    }

                    return {
                        id: doc.id,
                        event: d.eventName || "Evento",
                        date: dateDisplay,
                        spent: d.amount || 0,
                        seats: d.seats || [],
                        createdAt: d.createdAt
                    };
                });

                setHistory(historyData);

                // Fallback for totals if not in profile
                if (typeof user.totalSpent !== 'number') {
                    setTotalSpent(historyData.reduce((sum, h) => sum + (h.spent || 0), 0));
                }
                if (typeof user.visitCount !== 'number') {
                    setVisitCount(historyData.length);
                }

            } catch (err) {
                console.error("Error fetching visit history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [user?.uid]);

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
                    role: "user",
                    points: 0,
                    totalSpent: 0,
                    visitCount: 0
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

    const handleDelete = async () => {
        if (!user?.uid || !window.confirm("⚠️ ¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) return;
        try {
            await deleteDoc(doc(db, "users", user.uid));
            onSuccess?.();
            onClose();
        } catch (e: any) {
            alert(e.message);
        }
    };

    // Calculate Average Ticket
    const averageTicket = visitCount > 0 ? totalSpent / visitCount : 0;

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity flex items-center justify-center p-4 md:p-8" onClick={onClose}>
                <div className="bg-[#0f0f0f] w-full max-w-6xl max-h-full rounded-2xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

                    {/* HERO HEADER */}
                    <div className="relative bg-gradient-to-r from-stone-900 to-[#151515] p-8 border-b border-white/5">
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                            <FaTimes />
                        </button>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-bargoglio-orange to-red-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-orange-900/50 border-4 border-[#0f0f0f] overflow-hidden">
                                {formData.photoURL ? (
                                    <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{formData.nombre ? (formData.nombre[0] + (formData.apellido?.[0] || "")) : <FaUser />}</span>
                                )}
                            </div>

                            {/* Title & Badge */}
                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-3xl font-serif font-bold text-white">
                                    {formData.nombre || "Nuevo"} {formData.apellido || "Cliente"}
                                </h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${formData.nivel_cliente === "Oro" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                                        formData.nivel_cliente === "Plata" ? "bg-stone-400/10 text-stone-300 border-stone-400/30" :
                                            "bg-amber-700/10 text-amber-600 border-amber-700/30"
                                        }`}>
                                        {formData.nivel_cliente}
                                    </span>
                                    <span className="text-stone-500 text-sm flex items-center gap-2">
                                        <FaEnvelope className="text-stone-600" /> {formData.email || "Sin email"}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="md:ml-auto flex gap-3">
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-bold transition-all border border-white/10">
                                        <FaUserEdit /> Editar Perfil
                                    </button>
                                ) : (
                                    <>
                                        {!isNew && (
                                            <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar Cliente">
                                                <FaTrash />
                                            </button>
                                        )}
                                        <button onClick={() => { setIsEditing(false); if (isNew) onClose(); }} className="px-4 py-2 text-stone-400 hover:text-white font-bold text-sm">
                                            Cancelar
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-bargoglio-orange hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-900/20 transition-all">
                                            {saving ? <FaCircleNotch className="animate-spin" /> : <FaSave />}
                                            Guardar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DASHBOARD CONTENT */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
                        {!isNew && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                                {/* Metrics Deck */}
                                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Total Gastado</p>
                                        <FaMoneyBillWave className="text-green-500 opacity-50" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">${totalSpent.toLocaleString()}</p>
                                </div>
                                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Puntos Club</p>
                                        <FaStar className="text-bargoglio-orange opacity-50" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">{formData.points.toLocaleString()}</p>
                                </div>
                                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Visitas</p>
                                        <FaHistory className="text-purple-400 opacity-50" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">{visitCount}</p>
                                </div>
                                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Ticket Promedio</p>
                                        <FaMoneyBillWave className="text-blue-400 opacity-50" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">${averageTicket.toLocaleString()}</p>
                                </div>

                                {/* Table Ranking Card */}
                                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Mesa Favorita</p>
                                        <FaChair className="text-gold-500 opacity-50" />
                                    </div>

                                    {(() => {
                                        const tableCounts: Record<string, number> = {};
                                        history.forEach(visit => {
                                            visit.seats.forEach(seat => {
                                                let tableName = "General";

                                                // Parser Logic
                                                // Parser Logic
                                                // 1. Try Lookup from Static Definition
                                                const seatDef = getSeatDefinition(seat);
                                                if (seatDef?.tableNumber) {
                                                    tableName = `Mesa ${seatDef.tableNumber}`;
                                                }
                                                // 2. Fallbacks for legacy/other IDs
                                                else if (seat.startsWith("mesa-")) {
                                                    const parts = seat.split("-");
                                                    if (parts.length >= 2) tableName = `Mesa ${parts[1]}`;
                                                } else if (seat.match(/^T\d+/)) {
                                                    const match = seat.match(/^T(\d+)/);
                                                    if (match) tableName = `Mesa ${match[1]}`;
                                                } else if (seat.startsWith("barra")) {
                                                    tableName = "Barra";
                                                } else if (seat.includes("-")) {
                                                    tableName = `Mesa ${seat.split("-")[0]}`;
                                                }

                                                tableCounts[tableName] = (tableCounts[tableName] || 0) + 1;
                                            });
                                        });

                                        const sortedTables = Object.entries(tableCounts)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 3);

                                        if (sortedTables.length === 0) return <p className="text-stone-600 text-xs italic mt-1">Sin datos</p>;

                                        const topTable = sortedTables[0];

                                        return (
                                            <div>
                                                <p className="text-xl font-bold text-white truncate">{topTable[0]}</p>
                                                <p className="text-xs text-stone-500">{topTable[1]} reservas</p>
                                                {sortedTables.length > 1 && (
                                                    <p className="text-[10px] text-stone-600 mt-1 truncate">
                                                        También: {sortedTables.slice(1).map(t => t[0]).join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* LEFT: TIMELINE (History) */}
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-white font-serif font-bold text-lg flex items-center gap-2">
                                    <FaHistory className="text-bargoglio-orange" /> Línea de Tiempo
                                </h3>

                                {loadingHistory ? (
                                    <div className="flex justify-center py-12"><FaCircleNotch className="animate-spin text-stone-600 text-2xl" /></div>
                                ) : history.length === 0 ? (
                                    <div className="bg-[#151515] rounded-xl p-8 text-center border border-white/5 border-dashed">
                                        <p className="text-stone-600 italic">No hay historial de visitas registrado.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((visit, idx) => (
                                            <div key={visit.id} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-[-16px] before:w-[2px] before:bg-stone-800 last:before:hidden group">
                                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#1a1a1a] border-2 border-stone-700 group-hover:border-bargoglio-orange transition-colors flex items-center justify-center z-10">
                                                    <div className="w-2 h-2 rounded-full bg-stone-500 group-hover:bg-bargoglio-orange transition-colors" />
                                                </div>

                                                <div className="bg-[#151515] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all shadow-md group-hover:shadow-lg group-hover:shadow-black/40">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-white font-bold text-lg group-hover:text-bargoglio-orange transition-colors">{visit.event}</h4>
                                                            <div className="flex flex-col gap-1 mt-1 text-sm text-stone-500">
                                                                <span className="flex items-center gap-2"><FaCalendarAlt size={12} /> {visit.date}</span>

                                                                {/* Display Table Numbers */}
                                                                {(() => {
                                                                    const tableNumbers = Array.from(new Set(visit.seats.map(sId => {
                                                                        const def = getSeatDefinition(sId);
                                                                        return def?.tableNumber ? `Mesa ${def.tableNumber}` : null;
                                                                    }).filter(Boolean)));

                                                                    if (tableNumbers.length > 0) {
                                                                        return (
                                                                            <span className="flex items-center gap-2 text-stone-300">
                                                                                <FaChair size={12} className="text-gold-500" />
                                                                                {tableNumbers.join(", ")}
                                                                                <span className="text-stone-600">•</span>
                                                                                <span className="text-stone-500">{visit.seats.length} lugares</span>
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return <span className="flex items-center gap-2"><FaChair size={12} /> {visit.seats.length} lugares</span>;
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-green-400 font-bold font-mono text-lg">${visit.spent.toLocaleString()}</p>
                                                            <span className="text-[10px] uppercase tracking-widest text-stone-600 bg-stone-900/50 px-2 py-1 rounded">Confirmado</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: PROFILE DATA (Edit Form) */}
                            <div className="space-y-6">
                                <h3 className="text-white font-serif font-bold text-lg flex items-center gap-2">
                                    <FaUser className="text-stone-400" /> Datos Personales
                                </h3>

                                <div className="bg-[#151515] p-6 rounded-xl border border-white/5 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-stone-500 font-bold">Nombre</label>
                                            <input disabled={!isEditing} type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className={`w-full bg-transparent border-b ${isEditing ? 'border-stone-700 focus:border-bargoglio-orange' : 'border-transparent'} py-1 text-white outline-none transition-colors`} placeholder="Nombre" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-stone-500 font-bold">Apellido</label>
                                            <input disabled={!isEditing} type="text" value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} className={`w-full bg-transparent border-b ${isEditing ? 'border-stone-700 focus:border-bargoglio-orange' : 'border-transparent'} py-1 text-white outline-none transition-colors`} placeholder="Apellido" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-stone-500 font-bold">Email</label>
                                        <input disabled={!isEditing} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full bg-transparent border-b ${isEditing ? 'border-stone-700 focus:border-bargoglio-orange' : 'border-transparent'} py-1 text-white outline-none transition-colors`} placeholder="Email" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-stone-500 font-bold">Teléfono</label>
                                            <input disabled={!isEditing} type="tel" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className={`w-full bg-transparent border-b ${isEditing ? 'border-stone-700 focus:border-bargoglio-orange' : 'border-transparent'} py-1 text-white outline-none transition-colors`} placeholder="Teléfono" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-stone-500 font-bold">DNI</label>
                                            <input disabled={!isEditing} type="text" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} className={`w-full bg-transparent border-b ${isEditing ? 'border-stone-700 focus:border-bargoglio-orange' : 'border-transparent'} py-1 text-white outline-none transition-colors`} placeholder="DNI" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-stone-500 font-bold">Nacimiento</label>
                                        <input disabled={!isEditing} type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })} className={`w-full bg-transparent border-b ${isEditing ? 'border-stone-700 focus:border-bargoglio-orange' : 'border-transparent'} py-1 text-white outline-none transition-colors`} />
                                    </div>

                                    {/* Tier Selector (Only in Edit) */}
                                    {isEditing && (
                                        <div className="space-y-1 pt-2">
                                            <label className="text-[10px] uppercase text-stone-500 font-bold">Nivel de Cliente</label>
                                            <select value={formData.nivel_cliente} onChange={e => setFormData({ ...formData, nivel_cliente: e.target.value as any })} className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-white text-sm">
                                                <option value="Bronce">Bronce</option>
                                                <option value="Plata">Plata</option>
                                                <option value="Oro">Oro</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Staff Notes */}
                                <div className="space-y-2">
                                    <h3 className="text-white font-serif font-bold text-lg flex items-center gap-2">
                                        <FaStickyNote className="text-yellow-500" /> Notas Internas
                                    </h3>
                                    <textarea
                                        value={formData.notas_internas}
                                        onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
                                        placeholder="Solo visible para el staff..."
                                        className="w-full h-32 bg-[#151515] border border-white/5 focus:border-bargoglio-orange/50 rounded-xl p-4 text-stone-300 placeholder-stone-700 text-sm outline-none resize-none shadow-inner"
                                    />
                                    {!isEditing && (
                                        <button onClick={handleSave} disabled={saving || formData.notas_internas === user?.notas_internas} className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold uppercase rounded-lg transition-colors">
                                            Guardar Nota
                                        </button>
                                    )}
                                </div>


                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
