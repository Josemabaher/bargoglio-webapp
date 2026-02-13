"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { INITIAL_SEATS } from "@/src/lib/data/seats";
import { Seat } from "@/src/types";
import { FaSave, FaPlus, FaTrash, FaCopy } from "react-icons/fa";

export default function CalibrationPage() {
    const [seats, setSeats] = useState<Partial<Seat>[]>(INITIAL_SEATS);
    const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
    const [dragSeat, setDragSeat] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handlers for Drag and Drop
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragSeat(id);
        setSelectedSeatId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragSeat || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSeats(prev => prev.map(s =>
            s.id === dragSeat ? { ...s, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) } : s
        ));
    };

    const handleMouseUp = () => {
        setDragSeat(null);
    };

    // Edit Handlers
    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar silla?")) {
            setSeats(prev => prev.filter(s => s.id !== id));
            setSelectedSeatId(null);
        }
    };

    const handleAddSeat = () => {
        const newId = `NEW-${Date.now()}`;
        setSeats(prev => [...prev, {
            id: newId,
            tableId: "NEW",
            tableNumber: 0,
            status: "available",
            x: 50,
            y: 50,
            label: "Area Azul",
            price: 5000
        }]);
        setSelectedSeatId(newId);
    };

    const updateSelectedSeat = (field: keyof Seat, value: any) => {
        if (!selectedSeatId) return;
        setSeats(prev => prev.map(s =>
            s.id === selectedSeatId ? { ...s, [field]: value } : s
        ));
    };

    // Export
    const handleCopyConfig = () => {
        const config = JSON.stringify(seats, null, 2);
        navigator.clipboard.writeText(config);
        alert("Configuración copiada al portapapeles. Envíasela al desarrollador.");
    };

    return (
        <div className="min-h-screen bg-stone-950 text-white p-8" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Calibración de Asientos</h1>
                <div className="flex gap-4">
                    <button onClick={handleAddSeat} className="px-4 py-2 bg-green-600 rounded flex items-center gap-2">
                        <FaPlus /> Agregar Silla
                    </button>
                    <button onClick={handleCopyConfig} className="px-4 py-2 bg-blue-600 rounded flex items-center gap-2">
                        <FaCopy /> Copiar JSON
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Map Container */}
                <div className="col-span-9">
                    <div
                        ref={containerRef}
                        className="relative w-full aspect-[1000/700] bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden cursor-crosshair"
                    >
                        <Image
                            src="/Plano Mesas Bargoglio.jpg?v=2"
                            alt="Plano"
                            fill
                            className="object-contain opacity-70 pointer-events-none"
                            priority
                        />

                        {seats.map(seat => (
                            <div
                                key={seat.id}
                                onMouseDown={(e) => handleMouseDown(e, seat.id!)}
                                style={{
                                    left: `${seat.x}%`,
                                    top: `${seat.y}%`,
                                    width: '2.6%',
                                    height: '3.7%',
                                }}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 cursor-grab active:cursor-grabbing flex items-center justify-center text-[10px] font-bold
                                    ${selectedSeatId === seat.id ? 'bg-yellow-500 border-white text-black z-50' :
                                        seat.label === 'Area Azul' ? 'bg-blue-600 border-blue-400' :
                                            seat.label === 'Area Roja' ? 'bg-red-600 border-red-400' :
                                                'bg-yellow-500 border-yellow-300 text-black'}
                                `}
                            >
                                {seat.tableNumber}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Sidebar */}
                <div className="col-span-3 bg-stone-900 p-6 rounded-xl border border-white/10 h-fit">
                    {selectedSeatId ? (
                        <div className="space-y-4">
                            <h3 className="font-bold border-b border-white/10 pb-2">Editar Silla</h3>

                            <div>
                                <label className="block text-xs text-stone-500 mb-1">ID</label>
                                <input disabled value={selectedSeatId} className="w-full bg-black/30 p-2 rounded text-sm text-stone-500" />
                            </div>

                            <div>
                                <label className="block text-xs text-stone-500 mb-1">Nro Mesa</label>
                                <input
                                    type="number"
                                    value={seats.find(s => s.id === selectedSeatId)?.tableNumber || 0}
                                    onChange={(e) => updateSelectedSeat('tableNumber', parseInt(e.target.value))}
                                    className="w-full bg-black/30 border border-stone-700 p-2 rounded text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-stone-500 mb-1">Area</label>
                                <select
                                    value={seats.find(s => s.id === selectedSeatId)?.label || ""}
                                    onChange={(e) => updateSelectedSeat('label', e.target.value)}
                                    className="w-full bg-black/30 border border-stone-700 p-2 rounded text-white"
                                >
                                    <option value="Area Azul">Area Azul</option>
                                    <option value="Area Roja">Area Roja</option>
                                    <option value="Area Amarilla">Area Amarilla</option>
                                </select>
                            </div>

                            <button
                                onClick={() => handleDelete(selectedSeatId)}
                                className="w-full py-2 bg-red-900/50 text-red-400 border border-red-900 rounded hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
                            >
                                <FaTrash size={12} /> Eliminar Silla
                            </button>

                            <div className="pt-4 border-t border-white/10 text-xs text-stone-500">
                                <p>X: {seats.find(s => s.id === selectedSeatId)?.x}%</p>
                                <p>Y: {seats.find(s => s.id === selectedSeatId)?.y}%</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-stone-500">Selecciona una silla para editarla.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
