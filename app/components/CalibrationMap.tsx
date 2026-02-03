"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Seat } from "@/src/types";

interface CalibrationMapProps {
    seats: Seat[];
    onUpdateSeats: (updatedSeats: Seat[]) => void;
    selectedSeatIds: string[];
    onToggleSelection: (id: string) => void;
}

export default function CalibrationMap({ seats, onUpdateSeats, selectedSeatIds, onToggleSelection }: CalibrationMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const handleMouseDown = (e: React.MouseEvent, seatId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingId(seatId);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to percentage
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        // Clamp values 0-100
        const clampedX = Math.max(0, Math.min(100, xPercent));
        const clampedY = Math.max(0, Math.min(100, yPercent));

        // Update local state
        const updatedSeats = seats.map(s =>
            s.id === draggingId ? { ...s, x: clampedX, y: clampedY } : s
        );

        onUpdateSeats(updatedSeats);
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    // Global mouse up to catch drops outside the container
    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    return (
        <div
            className="w-full relative bg-charcoal-900 rounded-xl overflow-hidden border border-white/10"
            onMouseMove={handleMouseMove}
        >
            {/* Aspect Ratio Container (matching typical floor plan ratio) */}
            <div ref={containerRef} className="relative w-full aspect-[1000/700] bg-[#1a1a1a]">
                {/* Background Image */}
                <div className="absolute inset-0 pointer-events-none">
                    <Image
                        src="/mapa-planta.jpg"
                        alt="Plano para calibración"
                        fill
                        className="object-contain opacity-60"
                        priority
                    />
                </div>


                {/* Seats */}
                {seats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    let bgColor = "bg-gray-500"; // Default/Bar
                    if (seat.price && seat.price >= 5000) bgColor = "bg-[#D4AF37]"; // Gold
                    else if (seat.price && seat.price >= 4000) bgColor = "bg-purple-600"; // Premium
                    else if (seat.price && seat.price >= 3000) bgColor = "bg-blue-600"; // General

                    return (
                        <div
                            key={seat.id}
                            onMouseDown={(e) => handleMouseDown(e, seat.id)}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelection(seat.id);
                            }}
                            style={{
                                left: `${seat.x}%`,
                                top: `${seat.y}%`,
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer'
                            }}
                            className={`
                                absolute -translate-x-1/2 -translate-y-1/2 z-10
                                rounded-full flex items-center justify-center
                                border shadow-sm text-white border-white/30
                                transition-all duration-150
                                ${bgColor}
                                ${isSelected ? 'ring-4 ring-white z-50 scale-125' : 'hover:scale-110'}
                                ${draggingId === seat.id ? 'scale-125 z-50 cursor-grabbing' : ''}
                            `}
                            title={`${seat.label || seat.id} | Mesa ${seat.tableNumber || '?'} | $${seat.price || 0}`}
                        >
                            <span className="text-[8px] font-bold">{seat.tableNumber || '-'}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
