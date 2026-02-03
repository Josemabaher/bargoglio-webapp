"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase/config";
import { useSeats } from "@/src/hooks/useSeats";
import { useEvents } from "@/src/hooks/useEvents";
import { formatDate } from "@/src/lib/utils/format";
import AdminTableMap from "../components/AdminTableMap";
import SeatActionModal from "../components/SeatActionModal";

interface Event {
    id: string;
    name: string;
    date: string;
}

interface Reservation {
    id: string;
    seatIds: string[];
    userName?: string;
    userEmail?: string;
    status: string;
    checkedIn?: boolean;
}

function ReservationsContent() {
    const searchParams = useSearchParams();
    const urlEventId = searchParams.get("event");
    // const [events, setEvents] = useState<Event[]>([]); // Removed, replaced by useEvents
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedSeat, setSelectedSeat] = useState<{
        id: string,
        label: string,
        status?: "available" | "occupied" | "reserved",
        clientName?: string,
        price?: number
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { seats, loading: loadingSeats } = useSeats(selectedEventId);

    // 1. Fetch ALL events using the hook (Solves "Missing shows" by removing limit(10))
    const { events: allEvents, loading: loadingEvents } = useEvents(); // Assuming you have or can import useEvents

    // 2. Filter for ZONES only (Solves "Only shows with zone reservations")
    const zoneEvents = allEvents.filter(e => e.pricingType === 'zones');

    // Set initial selection
    useEffect(() => {
        if (!loadingEvents && zoneEvents.length > 0 && !selectedEventId) {
            // Prioritize URL parameter
            if (urlEventId && zoneEvents.some(e => e.id === urlEventId)) {
                setSelectedEventId(urlEventId);
            } else {
                // Default to the most recent/upcoming one (first in the list usually)
                setSelectedEventId(zoneEvents[0].id || null);
            }
        }
    }, [loadingEvents, zoneEvents, urlEventId, selectedEventId]);

    // Fetch reservations for selected event
    useEffect(() => {
        if (!selectedEventId) return;

        const fetchReservations = async () => {
            try {
                const reservationsRef = collection(db, "reservations");
                const q = query(reservationsRef, where("eventId", "==", selectedEventId));
                const snapshot = await getDocs(q);
                const reservationList: Reservation[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    reservationList.push({
                        id: doc.id,
                        seatIds: data.seatIds || [],
                        userName: data.userName,
                        userEmail: data.userEmail,
                        status: data.status,
                        checkedIn: data.checkedIn || false,
                    });
                });
                setReservations(reservationList);
            } catch (err) {
                console.error("Error fetching reservations:", err);
            }
        };
        fetchReservations();
    }, [selectedEventId, refreshTrigger]);

    const handleSeatClick = (seat: any) => {
        setSelectedSeat({
            id: seat.id,
            label: seat.tableNumber ? `Mesa ${seat.tableNumber}` : seat.id,
            status: seat.status,
            clientName: seat.clientName,
            price: seat.price
        });
        setIsModalOpen(true);
    };

    // Toggle check-in status
    const toggleCheckIn = async (reservationId: string, currentStatus: boolean) => {
        try {
            const reservationRef = doc(db, "reservations", reservationId);
            await updateDoc(reservationRef, {
                checkedIn: !currentStatus,
            });
            // Update local state
            setReservations((prev) =>
                prev.map((r) =>
                    r.id === reservationId ? { ...r, checkedIn: !currentStatus } : r
                )
            );
        } catch (err) {
            console.error("Error updating check-in:", err);
        }
    };

    // Create a map: seatId -> customer name
    const seatToCustomer: Record<string, string> = {};
    reservations.forEach((reservation) => {
        const customerName = reservation.userName || reservation.userEmail || "Cliente";
        reservation.seatIds.forEach((seatId) => {
            seatToCustomer[seatId] = customerName;
        });
    });

    // Create a map: seatId -> tableNumber from seats
    const seatToTable: Record<string, number | undefined> = {};
    seats.forEach((seat) => {
        seatToTable[seat.id] = seat.tableNumber;
    });

    // Convert seats to AdminSeat format with customer names
    const adminSeats = seats.map((seat) => ({
        id: seat.id,
        x: seat.x,
        y: seat.y,
        status: seat.status as "available" | "occupied" | "reserved",
        tableNumber: seat.tableNumber,
        price: seat.price,
        // Only show client name if seat is occupied or reserved
        clientName: seat.status !== "available" ? seatToCustomer[seat.id] : undefined,
    }));

    // Calculate stats - count all seats from the actual data
    const totalSeats = adminSeats.length;
    const available = adminSeats.filter((s) => s.status === "available").length;
    const occupied = adminSeats.filter((s) => s.status === "occupied").length;
    const reserved = adminSeats.filter((s) => s.status === "reserved").length;


    // Separate reservations by status
    const confirmedReservations = reservations.filter((r) => r.status === "confirmed");
    const pendingReservations = reservations.filter((r) => r.status === "pending");

    // Get table numbers for a reservation
    const getTableNumbers = (seatIds: string[]): string => {
        const tables = new Set<number>();
        seatIds.forEach((seatId) => {
            const tableNum = seatToTable[seatId];
            if (tableNum) tables.add(tableNum);
        });
        return Array.from(tables).sort((a, b) => a - b).join(", ") || "-";
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Mapa de Reservas</h1>
                    <p className="text-stone-500 mt-1">Vista administrativa del plano con información de clientes.</p>
                </div>

                {/* Event Selector */}
                <select
                    value={selectedEventId || ""}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="px-4 py-2 bg-[#1a1a1a] border border-stone-800/50 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50"
                >
                    {zoneEvents.length === 0 ? (
                        <option value="">{loadingEvents ? "Cargando..." : "No hay eventos con mapa"}</option>
                    ) : (
                        zoneEvents.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.title}
                            </option>
                        ))
                    )}
                </select>
            </div>

            {/* Selected Event Title & Date */}
            {selectedEventId && (
                <div className="bg-[#1a1a1a] border-l-4 border-bargoglio-orange px-6 py-4 rounded-r-lg flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                        {zoneEvents.find(e => e.id === selectedEventId)?.title}
                    </h2>
                    <span className="text-bargoglio-orange font-bold text-lg">
                        | {formatDate(zoneEvents.find(e => e.id === selectedEventId)?.date || '')}
                    </span>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-600"></span>
                    <span className="text-stone-400">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-600"></span>
                    <span className="text-stone-400">Ocupada</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-yellow-600"></span>
                    <span className="text-stone-400">Reservada (pendiente)</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-green-500">{available}</p>
                    <p className="text-stone-500 text-sm mt-1">Disponibles</p>
                </div>
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-red-500">{occupied}</p>
                    <p className="text-stone-500 text-sm mt-1">Ocupadas</p>
                </div>
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-yellow-500">{reserved}</p>
                    <p className="text-stone-500 text-sm mt-1">Reservadas</p>
                </div>
            </div>

            {/* Map */}
            {loadingSeats ? (
                <div className="flex items-center justify-center h-96 bg-[#1a1a1a] border border-stone-800/50 rounded-xl">
                    <p className="text-stone-500">Cargando mapa...</p>
                </div>
            ) : (
                <AdminTableMap seats={adminSeats} onSeatClick={handleSeatClick} />
            )}

            {/* Seat Action Modal */}
            {selectedEventId && selectedSeat && (
                <SeatActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    eventId={selectedEventId}
                    seatId={selectedSeat.id}
                    seatLabel={selectedSeat.label}
                    currentStatus={selectedSeat.status}
                    clientName={selectedSeat.clientName}
                    seatPrice={selectedSeat.price}

                    eventTitle={zoneEvents.find(e => e.id === selectedEventId)?.title}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}

            {/* Attendee Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Confirmed (Paid) - corresponds to occupied seats */}
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-800/50 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <h2 className="text-lg font-semibold text-white">Ocupadas (Pagadas)</h2>
                        <span className="ml-auto text-stone-500 text-sm">{occupied} lugares • {confirmedReservations.length} reservas</span>
                    </div>
                    <div className="divide-y divide-stone-800/50 max-h-80 overflow-y-auto">
                        {confirmedReservations.length === 0 ? (
                            <p className="px-6 py-4 text-stone-500 text-sm">No hay reservas confirmadas.</p>
                        ) : (
                            confirmedReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className={`px-6 py-3 flex items-center gap-4 transition-colors ${reservation.checkedIn
                                        ? "bg-green-900/20 border-l-4 border-l-green-500"
                                        : ""
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${reservation.checkedIn ? "text-green-400" : "text-white"}`}>
                                            {reservation.userName || reservation.userEmail || "Sin nombre"}
                                            <span className="text-stone-500 font-normal ml-2">({reservation.seatIds.length} {reservation.seatIds.length === 1 ? 'lugar' : 'lugares'})</span>
                                        </p>
                                    </div>
                                    <div className="text-stone-400 text-sm whitespace-nowrap">
                                        Mesa {getTableNumbers(reservation.seatIds)}
                                    </div>
                                    <button
                                        onClick={() => toggleCheckIn(reservation.id, reservation.checkedIn || false)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${reservation.checkedIn
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
                                            }`}
                                    >
                                        {reservation.checkedIn ? "✓ Presente" : "Marcar"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending (Not Paid) - corresponds to reserved seats */}
                <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-800/50 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <h2 className="text-lg font-semibold text-white">Reservadas (Pendientes)</h2>
                        <span className="ml-auto text-stone-500 text-sm">{reserved} lugares • {pendingReservations.length} reservas</span>
                    </div>
                    <div className="divide-y divide-stone-800/50 max-h-80 overflow-y-auto">
                        {pendingReservations.length === 0 ? (
                            <p className="px-6 py-4 text-stone-500 text-sm">No hay reservas pendientes.</p>
                        ) : (
                            pendingReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className={`px-6 py-3 flex items-center gap-4 transition-colors ${reservation.checkedIn
                                        ? "bg-yellow-900/20 border-l-4 border-l-yellow-500"
                                        : ""
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${reservation.checkedIn ? "text-yellow-400" : "text-white"}`}>
                                            {reservation.userName || reservation.userEmail || "Sin nombre"}
                                            <span className="text-stone-500 font-normal ml-2">({reservation.seatIds.length} {reservation.seatIds.length === 1 ? 'lugar' : 'lugares'})</span>
                                        </p>
                                    </div>
                                    <div className="text-stone-400 text-sm whitespace-nowrap">
                                        Mesa {getTableNumbers(reservation.seatIds)}
                                    </div>
                                    <button
                                        onClick={() => toggleCheckIn(reservation.id, reservation.checkedIn || false)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${reservation.checkedIn
                                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                            : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
                                            }`}
                                    >
                                        {reservation.checkedIn ? "✓ Presente" : "Marcar"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReservationsPage() {
    return (
        <Suspense fallback={<div className="text-white p-8">Cargando reservas...</div>}>
            <ReservationsContent />
        </Suspense>
    );
}
