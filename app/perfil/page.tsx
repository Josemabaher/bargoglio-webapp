"use client";

import { useAuth } from "@/src/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaStar, FaHistory, FaUserCircle, FaSignOutAlt, FaCalendarAlt, FaCircleNotch, FaChevronRight, FaCamera } from "react-icons/fa";
import { logout } from "@/src/lib/firebase/auth";
import { updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase/config";
import { Reservation } from "@/src/types";
import { formatDate } from "@/src/lib/utils/format";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface VisitHistory {
    id: string;
    date: string;
    event: string;
    spent: number;
    seats: number;
}

export default function ProfilePage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<VisitHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Updated State with new fields
    const [editData, setEditData] = useState({
        nombre: "",
        apellido: "",
        telefono: "",
        dni: "",
        direccion: "",
        provincia: "",
        fecha_nacimiento: ""
    });

    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect: Fill Form Data
    useEffect(() => {
        if (userProfile && !isEditing) {
            setEditData({
                nombre: userProfile.nombre || "",
                apellido: userProfile.apellido || "",
                telefono: userProfile.telefono || "",
                dni: userProfile.dni || "",
                direccion: userProfile.direccion || "",
                provincia: userProfile.provincia || "",
                fecha_nacimiento: userProfile.fecha_nacimiento
                    ? (userProfile.fecha_nacimiento instanceof Timestamp
                        ? userProfile.fecha_nacimiento.toDate().toISOString().split('T')[0]
                        : new Date(userProfile.fecha_nacimiento).toISOString().split('T')[0])
                    : ""
            });
        }
    }, [userProfile, isEditing]);

    // Effect: Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Effect: Fetch History
    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const reservationsRef = collection(db, "reservations");
                const q = query(
                    reservationsRef,
                    where("userId", "==", user.uid),
                    where("status", "==", "confirmed")
                );
                const snapshot = await getDocs(q);

                const visits: VisitHistory[] = await Promise.all(
                    snapshot.docs.map(async (resDoc) => {
                        const res = resDoc.data() as Reservation;

                        // Fetch event name
                        const eventDoc = await getDocs(query(collection(db, "events"), where("__name__", "==", res.eventId)));
                        const eventData = eventDoc.docs[0]?.data();

                        return {
                            id: resDoc.id,
                            date: res.timestamp ? formatDate(res.timestamp.toDate().toISOString().split('T')[0]) : "N/A",
                            event: eventData?.name || "Evento",
                            spent: res.totalAmount || 0,
                            seats: res.seatIds?.length || 0
                        };
                    })
                );

                setHistory(visits.sort((a, b) => b.date.localeCompare(a.date)));
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                nombre: editData.nombre,
                apellido: editData.apellido,
                telefono: editData.telefono,
                dni: editData.dni,
                direccion: editData.direccion,
                provincia: editData.provincia,
                fecha_nacimiento: editData.fecha_nacimiento ? Timestamp.fromDate(new Date(editData.fecha_nacimiento)) : null,
                updatedAt: Timestamp.now()
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Error al actualizar el perfil");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "profile");

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                // Update Firestore
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    photoURL: data.url,
                    updatedAt: Timestamp.now()
                });

                // Update Firebase Auth
                await updateProfile(user, {
                    photoURL: data.url
                });
            }
        } catch (err) {
            console.error("Error uploading photo:", err);
            alert("Error al subir la foto");
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center">
                <FaCircleNotch className="w-10 h-10 text-bargoglio-red animate-spin mb-4" />
                <p className="text-stone-500 animate-pulse">Cargando tu perfil...</p>
            </div>
        );
    }

    const tierColors: Record<string, string> = {
        Oro: "from-yellow-500 to-amber-600",
        Plata: "from-gray-300 to-stone-500",
        Bronce: "from-amber-700 to-amber-900"
    };

    const currentTier = userProfile?.nivel_cliente || "Bronce";

    return (
        <main className="min-h-screen bg-stone-950 text-stone-200 pb-20">
            <Navbar />

            {/* Header / Cover */}
            <div className="h-48 bg-bargoglio-red/10 relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#A11A1630_0%,_transparent_70%)]"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Identity Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#121212] border border-stone-800/50 rounded-2xl p-6 shadow-2xl">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative group">
                                    <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${tierColors[currentTier] || tierColors.Bronce} p-1 shadow-xl mb-4 transition-transform group-hover:scale-105 duration-500`}>
                                        <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden relative">
                                            {userProfile?.photoURL || user.photoURL ? (
                                                <img src={userProfile?.photoURL || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FaUserCircle className="w-full h-full text-stone-800" />
                                            )}

                                            {uploadingPhoto && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <FaCircleNotch className="w-6 h-6 text-bargoglio-red animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="absolute bottom-4 right-1 w-9 h-9 bg-bargoglio-red text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all border-2 border-[#121212] active:scale-95"
                                        title="Cambiar foto de perfil"
                                    >
                                        <FaCamera className="w-4 h-4" />
                                    </button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handlePhotoUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>

                                {isEditing ? (
                                    <div className="space-y-3 w-full">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">Nombre <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editData.nombre}
                                                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                                    placeholder="Nombre"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">Apellido <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editData.apellido}
                                                    onChange={(e) => setEditData({ ...editData, apellido: e.target.value })}
                                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                                    placeholder="Apellido"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">DNI <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={editData.dni}
                                                onChange={(e) => setEditData({ ...editData, dni: e.target.value })}
                                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                                placeholder="DNI"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">Teléfono <span className="text-red-500">*</span></label>
                                            <input
                                                type="tel"
                                                value={editData.telefono}
                                                onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                                placeholder="Teléfono"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">Dirección <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editData.direccion}
                                                    onChange={(e) => setEditData({ ...editData, direccion: e.target.value })}
                                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                                    placeholder="Calle y altura"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">Provincia <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editData.provincia}
                                                    onChange={(e) => setEditData({ ...editData, provincia: e.target.value })}
                                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                                    placeholder="Provincia"
                                                />
                                            </div>
                                        </div>

                                        <div className="text-left">
                                            <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold ml-1">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={editData.fecha_nacimiento}
                                                onChange={(e) => setEditData({ ...editData, fecha_nacimiento: e.target.value })}
                                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white text-sm focus:border-bargoglio-red outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                {saving ? <FaCircleNotch className="animate-spin" /> : <><FaSave /> Guardar</>}
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <FaTimes /> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-serif font-bold text-white mb-1">
                                            {userProfile?.nombre} {userProfile?.apellido}
                                        </h1>
                                        <p className="text-stone-500 text-sm mb-4">{user.email}</p>

                                        <div className="flex flex-col items-center gap-4">
                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${tierColors[currentTier] || tierColors.Bronce} text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg`}>
                                                Socio {currentTier}
                                            </div>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="text-stone-500 hover:text-white text-xs flex items-center gap-2 transition-colors"
                                            >
                                                <FaEdit /> Editar Perfil
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-stone-800/50 space-y-4">
                                <Link
                                    href="/#agenda"
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                >
                                    <span className="text-sm font-medium text-stone-300 group-hover:text-white">Reservar Mesa</span>
                                    <FaChevronRight className="w-3 h-3 text-stone-600 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-3 mt-4 text-sm font-bold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
                                >
                                    <FaSignOutAlt /> Cerrar Sesión
                                </button>
                            </div>
                        </div>

                        {/* Points Stats Widget */}
                        <div className="bg-[#121212] border border-stone-800/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-bargoglio-red/5 rounded-full blur-2xl group-hover:bg-bargoglio-red/10 transition-colors"></div>
                            <div className="flex items-center gap-2 mb-4">
                                <FaStar className="text-bargoglio-red" />
                                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Puntos Club</span>
                            </div>
                            <p className="text-5xl font-bold text-white">
                                {userProfile?.points?.toLocaleString() || 0}
                            </p>
                            <p className="text-stone-500 text-xs mt-2 italic">Sumás 1 punto por cada $1.000 consumidos</p>
                        </div>
                    </div>

                    {/* Right: History & Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                                    <FaHistory className="text-stone-600" /> Mi Actividad
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-20 bg-[#121212] border border-dashed border-stone-800 rounded-2xl">
                                        <FaCircleNotch className="w-6 h-6 animate-spin text-stone-600" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="bg-[#121212] border border-stone-800/50 rounded-2xl p-12 text-center">
                                        <FaCalendarAlt className="w-12 h-12 text-stone-800 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-white mb-2">Aún no tienes visitas</h3>
                                        <p className="text-stone-500 text-sm mb-6">Tus reservas aparecerán aquí una vez confirmadas.</p>
                                        <Link
                                            href="/#agenda"
                                            className="px-8 py-3 bg-bargoglio-red text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
                                        >
                                            Ver Próximos Shows
                                        </Link>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-[#121212] border border-stone-800/50 rounded-2xl p-5 hover:border-bargoglio-red/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-bargoglio-red/10 flex items-center justify-center text-bargoglio-red group-hover:bg-bargoglio-red group-hover:text-white transition-all">
                                                    <FaCalendarAlt />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold uppercase transition-colors group-hover:text-bargoglio-red">
                                                        {item.event}
                                                    </h4>
                                                    <p className="text-stone-500 text-xs mt-1">
                                                        {item.date} • {item.seats} {item.seats === 1 ? 'lugar' : 'lugares'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-stone-800/50 pt-4 md:pt-0">
                                                <span className="text-xs text-stone-600 md:mb-1">Total abonado</span>
                                                <span className="text-white font-bold md:text-xl">${item.spent.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </main>
    );
}
