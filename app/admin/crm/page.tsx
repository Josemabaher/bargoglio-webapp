"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaBirthdayCake, FaGift, FaTimes, FaCircleNotch, FaPlus } from "react-icons/fa";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase/config";
import ClientTable from "../components/ClientTable";
import BirthdayWidget from "../components/BirthdayWidget";
import ClientProfileDashboard from "../components/ClientProfileDashboard";
import { UserProfile } from "@/src/types";

export default function CRMPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [tierFilter, setTierFilter] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch ALL users without server-side sorting to avoid missing index issues
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);
                const userList: UserProfile[] = [];

                snapshot.forEach((doc) => {
                    userList.push({ uid: doc.id, ...doc.data() } as UserProfile);
                });

                // Client-side sort
                userList.sort((a, b) => {
                    const nameA = (a.nombre || "").toLowerCase();
                    const nameB = (b.nombre || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                setUsers(userList);
                calculateBirthdays(userList);
            } catch (err: any) {
                console.error("Error fetching users:", err);
                alert("Error cargando clientes: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [refreshTrigger]);

    const calculateBirthdays = (userList: UserProfile[]) => {
        const today = new Date();
        // Calculate range (Next 15 Days)
        const rangeEnd = new Date(today);
        rangeEnd.setDate(today.getDate() + 15);

        const upcoming = userList.filter(user => {
            if (!user.fecha_nacimiento) return false;

            const birthDateRef = user.fecha_nacimiento as any;
            let birthMonth: number;
            let birthDay: number;

            if (typeof birthDateRef === 'string') {
                const parts = birthDateRef.split('-');
                if (parts.length === 3) {
                    birthMonth = parseInt(parts[1], 10) - 1;
                    birthDay = parseInt(parts[2], 10);
                } else {
                    return false;
                }
            } else if (birthDateRef instanceof Timestamp) {
                const d = birthDateRef.toDate();
                birthMonth = d.getMonth();
                birthDay = d.getDate();
            } else {
                const d = new Date(birthDateRef);
                birthMonth = d.getMonth();
                birthDay = d.getDate();
            }

            const thisYearBday = new Date(today.getFullYear(), birthMonth, birthDay);
            thisYearBday.setHours(0, 0, 0, 0);

            if (thisYearBday < today) {
                thisYearBday.setFullYear(today.getFullYear() + 1);
            }

            // Check if in range [today, rangeEnd]
            return thisYearBday >= today && thisYearBday <= rangeEnd;
        }).map(user => {
            // ... mapping logic
            // I need to replicate the mapping logic but inside this tool call I cannot see the next lines.
            // I will assume the map continues correctly or I'll include the map in this replacement if I can see it.
            // I'll grab the user object retrieval again to be safe.
            const birthDateRef = user.fecha_nacimiento as any;
            let d: Date;
            if (birthDateRef instanceof Timestamp) d = birthDateRef.toDate();
            else if (typeof birthDateRef === 'string') d = new Date(birthDateRef); // simplistic, but logic above handles parts
            else d = new Date(birthDateRef);

            // Re-calculate date for display (thisYearBday)
            // Ideally I should store the calculated date in the filter to sort later, but here we just map.
            const birthDate = user.fecha_nacimiento instanceof Timestamp
                ? user.fecha_nacimiento.toDate()
                : new Date(user.fecha_nacimiento);

            // Fix timezone offset for string dates causing "day before" display
            // If string is YYYY-MM-DD, new Date() treats as UTC.
            if (typeof user.fecha_nacimiento === 'string' && user.fecha_nacimiento.includes('-')) {
                const [y, m, da] = user.fecha_nacimiento.split('-');
                birthDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(da));
            }

            return {
                uid: user.uid,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email, // Added email for link
                fecha: birthDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
                rawDate: birthDate // used for sorting if needed, though widget expects formatted string.
            };
        });

        // Sort by upcoming date
        upcoming.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

        setBirthdays(upcoming);
    };

    const filteredClients = users.filter((client) => {
        const fullName = `${client.nombre} ${client.apellido}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = !tierFilter || client.nivel_cliente === tierFilter;
        return matchesSearch && matchesTier;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Gestión de Clientes</h1>
                    <p className="text-stone-500 mt-1">CRM - Clientes, cumpleaños y fidelización.</p>
                </div>
                <button
                    onClick={() => setSelectedUser({ uid: "", nombre: "", apellido: "", email: "", telefono: "", points: 0, nivel_cliente: "Bronce", role: "user" } as any)}
                    className="flex items-center gap-2 px-6 py-3 bg-bargoglio-orange text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-all shadow-lg shadow-bargoglio-orange/20"
                >
                    <FaPlus /> Agregar Cliente
                </button>
            </div>

            {/* Birthday Widget */}
            {!loading && <BirthdayWidget birthdays={birthdays} limit={5} />}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-stone-800/50 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-bargoglio-orange/50 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400"
                        >
                            <FaTimes size={14} />
                        </button>
                    )}
                </div>

                {/* Tier Filters */}
                <div className="flex gap-2">
                    {["Bronce", "Plata", "Oro"].map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tierFilter === tier
                                ? tier === "Oro"
                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                                    : tier === "Plata"
                                        ? "bg-gray-400/20 text-gray-300 border border-gray-400/50 shadow-lg shadow-gray-400/10"
                                        : "bg-amber-700/20 text-amber-600 border border-amber-700/50 shadow-lg shadow-amber-700/10"
                                : "bg-[#1a1a1a] text-stone-400 border border-stone-800/50 hover:border-stone-600"
                                }`}
                        >
                            {tier}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-stone-800/50 rounded-xl">
                    <FaCircleNotch className="w-8 h-8 text-bargoglio-orange animate-spin mb-4" />
                    <p className="text-stone-500">Cargando base de clientes...</p>
                </div>
            ) : (
                <ClientTable clients={filteredClients} onSelectClient={setSelectedUser} />
            )}

            {/* Client 360 Dashboard Profile */}
            {selectedUser && (
                <ClientProfileDashboard
                    user={selectedUser.uid ? selectedUser : null}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}
        </div>
    );
}

