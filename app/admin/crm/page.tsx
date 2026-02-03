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
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);

        const upcoming = userList.filter(user => {
            if (!user.fecha_nacimiento) return false;

            // Handle both Timestamp and regular Date/ISO string if present
            const birthDate = user.fecha_nacimiento instanceof Timestamp
                ? user.fecha_nacimiento.toDate()
                : new Date(user.fecha_nacimiento);

            const thisYearBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

            // If birthday already passed this year, check next year (though we only care about "this week")
            // But if it's Dec 30 and bday is Jan 2, we need to handle year rollover
            if (thisYearBday < today && thisYearBday.getMonth() === 0 && today.getMonth() === 11) {
                thisYearBday.setFullYear(today.getFullYear() + 1);
            }

            return thisYearBday >= today && thisYearBday <= weekFromNow;
        }).map(user => {
            const birthDate = user.fecha_nacimiento instanceof Timestamp
                ? user.fecha_nacimiento.toDate()
                : new Date(user.fecha_nacimiento);

            return {
                uid: user.uid,
                nombre: user.nombre,
                apellido: user.apellido,
                fecha: birthDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
            };
        });

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
            {!loading && <BirthdayWidget birthdays={birthdays} />}

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

