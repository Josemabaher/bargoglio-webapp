"use client";

import { useState } from "react";
import Image from "next/image";

interface AdminSeat {
    id: string;
    x: number;
    y: number;
    status: "available" | "occupied" | "reserved";
    clientName?: string;
    tableNumber?: number;
    price?: number;
    label?: string; // Added label
}

interface AdminTableMapProps {
    seats: AdminSeat[];
    onSeatClick?: (seat: AdminSeat) => void;
}

export default function AdminTableMap({ seats, onSeatClick }: AdminTableMapProps) {
    const [hoveredSeat, setHoveredSeat] = useState<AdminSeat | null>(null);

    const getSeatColor = (status: string, label?: string) => {
        switch (status) {
            case "occupied":
                return "bg-red-600 border-red-400 opacity-80 cursor-not-allowed"; // Red for occupied
            case "reserved":
                return "bg-red-600 border-red-400 opacity-80 cursor-not-allowed"; // Red for reserved too (as per "Occupied = Red")
            case "available":
            default:
                return "bg-green-600 border-green-400 text-white"; // Green for available
        }
    };

    // Get tooltip position classes based on table number
    const getTooltipPosition = (tableNumber?: number) => {
        // Tables at top edge: show tooltip below
        if ([34, 35, 36, 37].includes(tableNumber || 0)) {
            return {
                containerClass: "top-full left-1/2 -translate-x-1/2 mt-2",
                arrowClass: "bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-stone-700",
            };
        }
        // Table 33: shift tooltip left (on right edge)
        if (tableNumber === 33) {
            return {
                containerClass: "bottom-full right-0 translate-x-0 mb-2",
                arrowClass: "top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-700",
            };
        }
        // Table 24: shift tooltip right (on left edge)
        if (tableNumber === 24) {
            return {
                containerClass: "bottom-full left-0 translate-x-0 mb-2",
                arrowClass: "top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-700",
            };
        }
        // Default: show above, centered
        return {
            containerClass: "bottom-full left-1/2 -translate-x-1/2 mb-2",
            arrowClass: "top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-700",
        };
    };

    return (
        <div className="relative w-full aspect-[1000/700] bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden">
            {/* Floor Plan Image */}
            <Image
                src="/Plano Mesas Bargoglio.jpg"
                alt="Plano del local"
                fill
                className="object-contain opacity-80"
                priority
            />

            {/* Seats Overlay */}
            {seats.map((seat) => {
                const tooltipPos = getTooltipPosition(seat.tableNumber);
                return (
                    <div
                        key={seat.id}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        style={{
                            left: `${seat.x}%`,
                            top: `${seat.y}%`,
                        }}
                        onClick={() => onSeatClick?.(seat)}
                        className={`
                            absolute -translate-x-1/2 -translate-y-1/2
                            w-6 h-6 rounded-full border-2 cursor-pointer
                            transition-transform duration-200 hover:scale-150 hover:z-50
                            ${getSeatColor(seat.status, seat.label)}
                        `}
                    >
                        {/* Tooltip */}
                        {hoveredSeat?.id === seat.id && (
                            <div className={`absolute ${tooltipPos.containerClass} px-3 py-2 bg-[#0a0a0a] border border-stone-700 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none min-w-[140px]`}>
                                {seat.clientName && (
                                    <div className="text-white font-semibold text-sm mb-1 flex items-center gap-1.5">
                                        <span className="text-bargoglio-orange">👤</span> {seat.clientName}
                                    </div>
                                )}
                                <div className="text-bargoglio-orange font-medium text-sm">
                                    Mesa {seat.tableNumber || "?"}
                                </div>
                                <div className="text-stone-500 text-xs mt-0.5">
                                    {seat.price ? `$${seat.price.toLocaleString()}` : ""} • {seat.status === "occupied" ? "Ocupada" : seat.status === "reserved" ? "Reservada" : "Disponible"}
                                </div>
                                {/* Arrow */}
                                <div className={`absolute ${tooltipPos.arrowClass}`}></div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

