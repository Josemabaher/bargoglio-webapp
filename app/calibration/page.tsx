"use client";

import { useState, useEffect } from "react";
import { useSeats } from "@/src/hooks/useSeats";
import CalibrationMap from "../components/CalibrationMap";
import { Seat } from "@/src/types";

export default function CalibrationPage() {
    // We pass a dummy ID or handle the hook to return default data if null
    // Assuming useSeats handles null or we can pass a known ID if needed.
    // For now, we rely on the hook's fallback data logic.
    const { seats: initialSeats, loading } = useSeats("placeholder-for-calibration");
    const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

    const [seats, setSeats] = useState<Seat[]>([]);

    useEffect(() => {
        if (initialSeats.length > 0) {
            setSeats(initialSeats);
        }
    }, [initialSeats]);

    const handleUpdateSeats = (updatedSeats: Seat[]) => {
        setSeats(updatedSeats);
    };

    const handleExport = () => {
        const exportData = seats.map(({ id, x, y, label, price, status, tableId, tableNumber }) => ({
            id, tableId, tableNumber, status, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), label, price
        }));

        const jsonString = JSON.stringify(exportData, null, 2);

        navigator.clipboard.writeText(jsonString).then(() => {
            alert("¡Coordenadas copiadas al portapapeles! Envíame este código.");
        });
    };

    const handleToggleSelection = (id: string) => {
        setSelectedSeatIds(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleAssignZone = (price: number, label: string) => {
        if (selectedSeatIds.length === 0) return;

        const updatedSeats = seats.map(s => {
            if (selectedSeatIds.includes(s.id)) {
                return { ...s, price, label };
            }
            return s;
        });

        setSeats(updatedSeats);
    };

    const handleAssignTable = (tableNumber: number) => {
        if (selectedSeatIds.length === 0) return;

        const updatedSeats = seats.map(s => {
            if (selectedSeatIds.includes(s.id)) {
                return { ...s, tableNumber };
            }
            return s;
        });

        setSeats(updatedSeats);
    };

    if (loading && seats.length === 0) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>;
    }

    return (
        <main className="min-h-screen bg-stone-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-serif font-bold text-gold-400">Calibración de Zonas y Mesas</h1>
                        <button
                            onClick={handleExport}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg transition-all"
                        >
                            COPIAR CONFIGURACIÓN (JSON)
                        </button>
                    </div>

                    {/* Zone Assignment Controls */}
                    <div className="bg-charcoal-800 p-4 rounded-xl border border-white/10 flex gap-4 items-center flex-wrap">
                        <span className="text-stone-400 text-sm font-bold uppercase tracking-wider mr-2">
                            Asignar {selectedSeatIds.length} seleccionados a:
                        </span>
                        <button onClick={() => handleAssignZone(5000, "Zona 1")} className="px-4 py-2 rounded bg-[#D4AF37] text-black font-bold hover:scale-105 transition">
                            Zona 1 ($5000)
                        </button>
                        <button onClick={() => handleAssignZone(4000, "Zona 2")} className="px-4 py-2 rounded bg-purple-600 text-white font-bold hover:scale-105 transition">
                            Zona 2 ($4000)
                        </button>
                        <button onClick={() => handleAssignZone(3000, "Zona 3")} className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:scale-105 transition">
                            Zona 3 ($3000)
                        </button>
                        <button onClick={() => handleAssignZone(2000, "Zona 4")} className="px-4 py-2 rounded bg-gray-500 text-white font-bold hover:scale-105 transition">
                            Zona 4 ($2000)
                        </button>
                        <button onClick={() => setSelectedSeatIds([])} className="ml-auto px-3 py-1 text-xs text-stone-500 hover:text-white underline">
                            Deseleccionar todo
                        </button>
                    </div>

                    {/* Table Number Assignment Controls */}
                    <div className="bg-charcoal-800 p-4 rounded-xl border border-white/10 flex gap-4 items-center flex-wrap">
                        <span className="text-stone-400 text-sm font-bold uppercase tracking-wider mr-2">
                            Asignar Mesa:
                        </span>
                        <select
                            onChange={(e) => handleAssignTable(Number(e.target.value))}
                            className="px-4 py-2 rounded bg-stone-700 text-white font-bold border border-stone-600 cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>Seleccionar mesa...</option>
                            {Array.from({ length: 37 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>Mesa {num}</option>
                            ))}
                        </select>
                        <span className="text-stone-500 text-xs">
                            (Selecciona asientos y elige la mesa del dropdown)
                        </span>
                    </div>
                </div>

                <div className="bg-charcoal-900 p-4 rounded-xl border border-white/10">
                    <p className="text-stone-400 mb-4 text-sm">
                        1. Haz clic en las sillas para seleccionarlas (se pondrán blancas).<br />
                        2. Usa los botones de arriba para asignarles su ZONA (cambiarán de color).<br />
                        3. Arrástralas para corregir su posición si es necesario.
                    </p>
                    <CalibrationMap
                        seats={seats}
                        onUpdateSeats={handleUpdateSeats}
                        selectedSeatIds={selectedSeatIds}
                        onToggleSelection={handleToggleSelection}
                    />
                </div>

                <div className="bg-charcoal-800 p-4 rounded-lg font-mono text-xs text-stone-500 overflow-auto max-h-40">
                    <pre>{JSON.stringify(seats.map(s => ({ id: s.id, x: s.x.toFixed(1), y: s.y.toFixed(1) })), null, 2)}</pre>
                </div>
            </div>
        </main>
    );
}
