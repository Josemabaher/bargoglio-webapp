"use client";

import { useState, useEffect, useRef } from "react";
import { FaTimes, FaSearch, FaUserPlus, FaSave, FaBirthdayCake, FaTrashAlt, FaUser } from "react-icons/fa";
import { db } from "@/src/lib/firebase/config";
import { collection, query, getDocs, where, Timestamp, addDoc, doc, updateDoc, deleteDoc, getDoc, increment, setDoc } from "firebase/firestore";
import { UserProfile } from "@/src/types";

interface SeatActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    seatId: string;
    seatLabel: string;
    onSuccess: () => void;
    currentStatus?: "available" | "occupied" | "reserved";
    clientName?: string;
    seatPrice?: number;
    eventTitle?: string;
}

export default function SeatActionModal({
    isOpen,
    onClose,
    eventId,
    seatId,
    seatLabel,
    onSuccess,
    currentStatus = "available",
    clientName,
    seatPrice,
    eventTitle
}: SeatActionModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isNewUser, setIsNewUser] = useState(true);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        fecha_nacimiento: "",
    });

    const searchRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside of search results
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search users in Firestore
    useEffect(() => {
        if (searchTerm.length < 2 || currentStatus !== "available") {
            setSearchResults([]);
            return;
        }

        const searchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef);
                const snapshot = await getDocs(q);
                const results: UserProfile[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data() as UserProfile;
                    const fullName = `${data.nombre} ${data.apellido}`.toLowerCase();
                    if (fullName.includes(searchTerm.toLowerCase()) || data.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
                        results.push({ ...data, uid: doc.id });
                    }
                });
                setSearchResults(results.slice(0, 5));
                setShowResults(true);
            } catch (err) {
                console.error("Error searching users:", err);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, currentStatus]);

    const handleSelectUser = (user: UserProfile) => {
        setFormData({
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            email: user.email || "",
            telefono: user.telefono || "",
            fecha_nacimiento: user.fecha_nacimiento ?
                (user.fecha_nacimiento instanceof Timestamp ?
                    user.fecha_nacimiento.toDate().toISOString().split('T')[0] :
                    user.fecha_nacimiento) : "",
        });
        setIsNewUser(false);
        setShowResults(false);
        setSearchTerm(`${user.nombre} ${user.apellido}`);
    };

    const handleRelease = async () => {
        if (!confirm(`¿Estás seguro de que deseas liberar el asiento ${seatLabel}?`)) return;

        setLoading(true);
        try {
            // 1. Update Seat status in Event
            await updateDoc(doc(db, "events", eventId, "seats", seatId), {
                status: "available",
                reservedBy: null,
                clientName: null,
            });

            // 2. Find and update/delete reservation
            const reservationsRef = collection(db, "reservations");
            const q = query(reservationsRef,
                where("eventId", "==", eventId),
                where("seatIds", "array-contains", seatId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const resDoc = snapshot.docs[0];
                const resData = resDoc.data();
                const currentSeats: string[] = resData.seatIds || [];

                if (currentSeats.length <= 1) {
                    // Only one seat, delete reservation
                    await deleteDoc(resDoc.ref);
                } else {
                    // Multiple seats, remove this one
                    await updateDoc(resDoc.ref, {
                        seatIds: currentSeats.filter(id => id !== seatId)
                    });
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error releasing seat:", err);
            alert("Error al liberar el asiento");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Check/Create User
            let userId = "";
            const usersRef = collection(db, "users");

            if (isNewUser) {
                const q = query(usersRef, where("email", "==", formData.email));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    userId = snapshot.docs[0].id;
                    await updateDoc(doc(db, "users", userId), {
                        nombre: formData.nombre,
                        apellido: formData.apellido,
                        telefono: formData.telefono,
                        fecha_nacimiento: formData.fecha_nacimiento ? Timestamp.fromDate(new Date(formData.fecha_nacimiento)) : null,
                    });
                } else {
                    const userDoc = await addDoc(usersRef, {
                        nombre: formData.nombre,
                        apellido: formData.apellido,
                        email: formData.email,
                        telefono: formData.telefono,
                        fecha_nacimiento: formData.fecha_nacimiento ? Timestamp.fromDate(new Date(formData.fecha_nacimiento)) : null,
                        nivel_cliente: "Bronce",
                        points: 0,
                        role: "user",
                        createdAt: Timestamp.now(),
                    });
                    userId = userDoc.id;
                }
            } else {
                const q = query(usersRef, where("email", "==", formData.email));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    userId = snapshot.docs[0].id;
                }
            }

            // 1.5 Update User Points & Stats (Write-Time Aggregation)
            if (userId) {
                const pointsToAdd = Math.floor((seatPrice || 0) / 1000);

                await updateDoc(doc(db, "users", userId), {
                    points: increment(pointsToAdd),
                    totalSpent: increment(seatPrice || 0),
                    visitCount: increment(1),
                    lastVisit: Timestamp.now()
                });
            }

            // 2. Create Reservation
            const reservationRef = await addDoc(collection(db, "reservations"), {
                eventId,
                eventName: eventTitle || "Evento",
                userId: userId || "manual-booking",
                userEmail: formData.email,
                userName: `${formData.nombre} ${formData.apellido}`,
                seatIds: [seatId],
                totalAmount: seatPrice || 0, // Store price for points calculation
                amount: seatPrice || 0, // Store as amount too for compatibility
                status: "confirmed",
                checkedIn: true,
                createdAt: Timestamp.now(),
            });

            // 2.5 Write to Subcollection History
            if (userId) {
                // Fetch Event Date for the record
                let finalEventDate = "Fecha N/A";
                try {
                    const evDoc = await getDoc(doc(db, "events", eventId));
                    if (evDoc.exists()) {
                        const evData = evDoc.data();
                        // evData.date should be YYYY-MM-DD string
                        finalEventDate = evData.date || "Fecha N/A";
                    }
                } catch (e) {
                    console.error("Error fetching event date:", e);
                }

                const visitData = {
                    reservationId: reservationRef.id,
                    eventId,
                    eventName: eventTitle || "Evento",
                    amount: seatPrice || 0,
                    seats: [seatId],
                    createdAt: Timestamp.now(),
                    date: finalEventDate
                };
                await setDoc(doc(db, "users", userId, "visits", reservationRef.id), visitData);
            }

            // 3. Update Seat status in Event
            await updateDoc(doc(db, "events", eventId, "seats", seatId), {
                status: "occupied",
                reservedBy: userId || "manual-booking",
                clientName: `${formData.nombre} ${formData.apellido}`,
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error creating manual booking:", err);
            alert("Error al crear la reserva");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121212] border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#1a1a1a]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {currentStatus === "available" ? (
                                <><FaUserPlus className="text-bargoglio-orange" /> Carga Manual</>
                            ) : (
                                <><FaUser className="text-bargoglio-orange" /> Gestión de Asiento</>
                            )}
                        </h2>
                        <p className="text-stone-500 text-sm mt-0.5">Silla {seatLabel} • {currentStatus === "available" ? "Disponible" : "Ocupada"}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                {currentStatus === "available" ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="relative" ref={searchRef}>
                            <label className="block text-sm font-medium text-stone-400 mb-1.5">Buscar Cliente (Existente)</label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
                                <input
                                    type="text"
                                    placeholder="Nombre, apellido o email..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (!e.target.value) setIsNewUser(true);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-stone-800 rounded-lg text-white placeholder-stone-700 focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                                />
                            </div>

                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-[#1a1a1a] border border-stone-800 rounded-lg shadow-2xl overflow-hidden">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.uid}
                                            type="button"
                                            onClick={() => handleSelectUser(user)}
                                            className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center justify-between border-b border-stone-800/50 last:border-0"
                                        >
                                            <div>
                                                <p className="text-white font-medium">{user.nombre} {user.apellido}</p>
                                                <p className="text-stone-500 text-xs">{user.email}</p>
                                            </div>
                                            <span className="text-xs bg-stone-800 text-stone-400 px-2 py-1 rounded">Seleccionar</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-stone-400">Nombre</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-stone-800 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-stone-400">Apellido</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-stone-800 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-stone-400">Email</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-[#0a0a0a] border border-stone-800 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-stone-400">Teléfono</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-stone-800 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-stone-400 flex items-center gap-1.5">
                                    <FaBirthdayCake className="text-stone-600" size={12} />
                                    Fecha Nac.
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={formData.fecha_nacimiento}
                                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-stone-800 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 border border-stone-800 text-stone-400 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-bargoglio-orange text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-bargoglio-orange/20"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <FaSave size={14} />
                                )}
                                Confirmar Reserva
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-8 space-y-6 text-center">
                        <div className="space-y-2">
                            <p className="text-stone-500 text-sm uppercase tracking-widest">Asiento ocupado por</p>
                            <p className="text-2xl font-bold text-white">{clientName || "Cliente"}</p>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                            <p className="text-stone-400 text-sm italic">
                                Si liberas este asiento, volverá a estar disponible para la venta. Si es parte de una reserva con más asientos, solo se quitará este lugar de la reserva.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRelease}
                                disabled={loading}
                                className="w-full py-4 bg-red-600 text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <FaTrashAlt size={14} />
                                )}
                                Liberar Asiento
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-stone-500 font-medium text-sm hover:text-white transition-colors"
                            >
                                Volver al mapa
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
