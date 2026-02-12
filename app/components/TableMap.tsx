"use client";

import { useState } from "react";
import Image from "next/image";
import { FaChair, FaCouch, FaWineGlass, FaPlus, FaMinus, FaExpand, FaRotateRight } from "react-icons/fa6";
import { Seat } from "@/src/types";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface TableMapProps {
    seats: Seat[];
    selectedSeatIds: string[];
    onToggleSeat: (seat: Seat) => void;
}

export default function TableMap({ seats, selectedSeatIds, onToggleSeat }: TableMapProps) {
    const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

    // Helpers
    // getSeatIcon removed as icons are no longer used.

    const getSeatColor = (seat: Seat) => {
        if (seat.status === 'occupied') return "bg-red-900/80 text-white border-red-950 cursor-not-allowed opacity-60";
        if (seat.status === 'reserved') return "bg-red-900/80 text-white border-red-950 cursor-not-allowed";
        if (selectedSeatIds.includes(seat.id)) return "bg-yellow-500 text-black border-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.8)] z-50 scale-150 ring-2 ring-yellow-200";

        // Available - Zone based coloring (Optional, or uniform Green)
        // Using "Verde" as requested by user for Available
        return "bg-green-600/90 text-white border-green-400/50 hover:bg-green-500 hover:scale-125 hover:z-40 hover:shadow-lg transition-all duration-200";
    };

    const getPriceZoneColor = (price?: number) => {
        if (!price) return "transparent";
        if (price >= 5000) return "rgba(212, 175, 55, 0.1)"; // Gold - VIP
        if (price >= 4000) return "rgba(168, 85, 247, 0.1)"; // Purple - Premium
        if (price >= 3000) return "rgba(59, 130, 246, 0.1)"; // Blue - Zona 3
        return "rgba(148, 163, 184, 0.1)"; // Gray - Default
    };

    return (
        <div className="w-full max-w-[100vw] aspect-[1000/700] relative bg-charcoal-900 rounded-2xl border border-white/5 overflow-hidden shadow-2xl touch-none mx-auto">
            {/* Header and Legend removed - moved to parent component */}

            <TransformWrapper
                initialScale={0.5}
                minScale={0.2}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        {/* Controls */}
                        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
                            <button onClick={() => zoomIn()} className="p-3 bg-charcoal-800 text-gold-400 rounded-full shadow-lg border border-white/10 hover:bg-charcoal-700 transition" aria-label="Zoom In">
                                <FaPlus />
                            </button>
                            <button onClick={() => zoomOut()} className="p-3 bg-charcoal-800 text-gold-400 rounded-full shadow-lg border border-white/10 hover:bg-charcoal-700 transition" aria-label="Zoom Out">
                                <FaMinus />
                            </button>
                            <button onClick={() => resetTransform()} className="p-3 bg-charcoal-800 text-gold-400 rounded-full shadow-lg border border-white/10 hover:bg-charcoal-700 transition" aria-label="Reset View">
                                <FaExpand />
                            </button>
                        </div>

                        <TransformComponent wrapperClass="!w-full !h-full" contentStyle={{ width: "100%", height: "100%" }}>
                            <div className="relative w-[1000px] h-[700px] bg-[#1a1a1a]"> {/* Fixed size for coordinate system */}

                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <Image
                                        src="/Plano Mesas Bargoglio.jpg"
                                        alt="Floor Plan"
                                        fill
                                        className="object-contain opacity-80"
                                        priority
                                    />
                                </div>

                                {/* Seats Layer */}
                                <div className="absolute inset-0">
                                    {seats.map((seat) => (
                                        <button
                                            key={seat.id}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent drag/pan propagation if needed
                                                if (seat.status === 'available') onToggleSeat(seat);
                                            }}
                                            onTouchEnd={(e) => {
                                                // Handle touch tap specifically if click is eaten by panning?
                                                // React Zoom Pan Pinch usually handles mixed events well.
                                                // We'll rely on onClick first.
                                            }}
                                            disabled={seat.status !== 'available'}
                                            style={{
                                                left: `${seat.x}%`,
                                                top: `${seat.y}%`,
                                                width: '26px',
                                                height: '26px',
                                            }}
                                            className={`
                                                absolute -translate-x-1/2 -translate-y-1/2
                                                rounded-full flex items-center justify-center
                                                border-2 shadow-sm touch-manipulation
                                                ${getSeatColor(seat)}
                                            `}
                                        >
                                            {/* Inner Visual (Icon) - REMOVED */}
                                            {/* <span className="pointer-events-none drop-shadow-md">
                                                {getSeatIcon(seat.type)}
                                            </span> */}

                                            {/* Tooltip on Hover (Desktop) or always visible if zoomed in? */}
                                            {/* We'll use a simple absolute positioning that scales with zoom */}
                                        </button>
                                    ))}
                                </div>

                                {/* Zoning Visuals (Optional overlays) */}
                                {/* Example: VIP Zone Overlay */}
                                {/* Zoning Visuals (Optional overlays) - REMOVED */}
                                {/* Example: VIP Zone Overlay was here */}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
