"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaQrcode, FaMagnifyingGlass, FaCheck, FaXmark, FaCircleCheck, FaCircleXmark, FaFileExcel, FaFilePdf } from 'react-icons/fa6';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

interface Attendee {
    id: string;
    eventId: string;
    userId: string;
    seatIds: string[];
    amount: number;
    status: string;
    checkInStatus: 'pending' | 'checked-in';
    createdAt: any;
}

interface ScanResult {
    success: boolean;
    message: string;
    attendee?: Attendee;
}

export default function DoorPage() {
    const [scanMode, setScanMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const scannerRef = useRef<any>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);

    // Fetch attendees from Firestore
    const fetchAttendees = useCallback(async () => {
        try {
            const q = query(
                collection(db, 'reservations'),
                where('status', '==', 'confirmed'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Attendee[];
            setAttendees(data);
        } catch (error) {
            console.error("Error fetching attendees:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendees();
    }, [fetchAttendees]);

    // Initialize QR Scanner
    useEffect(() => {
        if (scanMode && scannerContainerRef.current) {
            import('html5-qrcode').then(({ Html5Qrcode }) => {
                const scanner = new Html5Qrcode("qr-scanner-container");
                scannerRef.current = scanner;

                scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    async (decodedText) => {
                        // Stop scanner on successful scan
                        await scanner.stop();
                        setScanMode(false);
                        handleScanResult(decodedText);
                    },
                    (errorMessage) => {
                        // Ignore scanning errors (no QR found yet)
                    }
                ).catch((err: Error) => {
                    console.error("Error starting scanner:", err);
                    setScanResult({
                        success: false,
                        message: "No se pudo acceder a la cámara. Verifica los permisos."
                    });
                    setScanMode(false);
                });
            });
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, [scanMode]);

    // Handle QR Scan Result
    const handleScanResult = async (reservationId: string) => {
        try {
            // Find the reservation in current list
            const attendee = attendees.find(a => a.id === reservationId);

            if (!attendee) {
                setScanResult({
                    success: false,
                    message: `Reserva no encontrada: ${reservationId}`
                });
                return;
            }

            if (attendee.checkInStatus === 'checked-in') {
                setScanResult({
                    success: false,
                    message: "Esta entrada ya fue utilizada",
                    attendee
                });
                return;
            }

            // Update check-in status in Firestore
            await updateDoc(doc(db, 'reservations', reservationId), {
                checkInStatus: 'checked-in',
                checkInTime: new Date()
            });

            // Update local state
            setAttendees(prev => prev.map(a =>
                a.id === reservationId
                    ? { ...a, checkInStatus: 'checked-in' as const }
                    : a
            ));

            setScanResult({
                success: true,
                message: "¡Check-in exitoso!",
                attendee
            });

        } catch (error) {
            console.error("Check-in error:", error);
            setScanResult({
                success: false,
                message: "Error al procesar el check-in"
            });
        }
    };

    // Manual check-in
    const handleManualCheckIn = async (attendeeId: string) => {
        await handleScanResult(attendeeId);
    };

    // Stop scanner
    const stopScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
        }
        setScanMode(false);
    };

    // Filter attendees by search term
    const filteredAttendees = attendees.filter(a =>
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.seatIds.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Gestión de Puerta</h2>
                <div className="flex gap-4">
                    <a
                        href="/api/admin/export?format=excel"
                        className="px-4 py-2 bg-green-800 rounded hover:bg-green-700 flex items-center gap-2"
                    >
                        <FaFileExcel /> Excel
                    </a>
                    <a
                        href="/api/admin/export?format=pdf"
                        className="px-4 py-2 bg-red-800 rounded hover:bg-red-700 flex items-center gap-2"
                    >
                        <FaFilePdf /> PDF
                    </a>
                    <button
                        onClick={() => scanMode ? stopScanner() : setScanMode(true)}
                        className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${scanMode ? 'bg-red-900 text-white' : 'bg-gold-600 text-black'}`}
                    >
                        <FaQrcode /> {scanMode ? 'Detener Escáner' : 'Escanear QR'}
                    </button>
                </div>
            </div>

            {/* Scan Result Notification */}
            {scanResult && (
                <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${scanResult.success
                        ? 'bg-green-900/50 border border-green-500'
                        : 'bg-red-900/50 border border-red-500'
                    }`}>
                    <div className="flex items-center gap-3">
                        {scanResult.success
                            ? <FaCircleCheck className="text-green-400 text-2xl" />
                            : <FaCircleXmark className="text-red-400 text-2xl" />
                        }
                        <div>
                            <p className={`font-bold ${scanResult.success ? 'text-green-300' : 'text-red-300'}`}>
                                {scanResult.message}
                            </p>
                            {scanResult.attendee && (
                                <p className="text-stone-400 text-sm">
                                    Asientos: {scanResult.attendee.seatIds.join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setScanResult(null)}
                        className="text-stone-400 hover:text-white"
                    >
                        <FaXmark />
                    </button>
                </div>
            )}

            {/* QR Scanner */}
            {scanMode && (
                <div className="mb-8 bg-black border border-stone-800 rounded-xl overflow-hidden">
                    <div
                        id="qr-scanner-container"
                        ref={scannerContainerRef}
                        className="w-full"
                        style={{ minHeight: '300px' }}
                    />
                    <p className="text-center text-stone-500 py-3 text-sm">
                        Apunta la cámara al código QR de la entrada
                    </p>
                </div>
            )}

            {/* Attendee Table */}
            <div className="bg-charcoal-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-stone-700 flex gap-4">
                    <div className="relative flex-1">
                        <FaMagnifyingGlass className="absolute left-3 top-3 text-stone-500" />
                        <input
                            type="text"
                            placeholder="Buscar por ID, usuario o asiento..."
                            className="w-full bg-stone-900 border-none rounded py-2 pl-10 text-white focus:ring-1 focus:ring-gold-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-stone-400 text-sm flex items-center">
                        {attendees.filter(a => a.checkInStatus === 'checked-in').length} / {attendees.length} ingresados
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-stone-500">Cargando...</div>
                ) : (
                    <table className="w-full text-left text-sm text-stone-300">
                        <thead className="bg-stone-900 text-stone-500 uppercase font-medium">
                            <tr>
                                <th className="p-4">ID Reserva</th>
                                <th className="p-4">Asientos</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-700">
                            {filteredAttendees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-stone-500">
                                        No se encontraron reservas
                                    </td>
                                </tr>
                            ) : (
                                filteredAttendees.map(attendee => (
                                    <tr key={attendee.id} className="hover:bg-white/5">
                                        <td className="p-4 font-mono text-gold-400 text-xs">{attendee.id.slice(0, 12)}...</td>
                                        <td className="p-4">{attendee.seatIds.join(', ')}</td>
                                        <td className="p-4">${attendee.amount?.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs uppercase ${attendee.checkInStatus === 'checked-in'
                                                    ? 'bg-green-900 text-green-300'
                                                    : 'bg-yellow-900 text-yellow-300'
                                                }`}>
                                                {attendee.checkInStatus === 'checked-in' ? 'Ingresado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {attendee.checkInStatus === 'pending' && (
                                                <button
                                                    onClick={() => handleManualCheckIn(attendee.id)}
                                                    className="px-3 py-1 bg-stone-700 hover:bg-green-700 hover:text-white rounded transition-colors"
                                                    title="Check-In Manual"
                                                >
                                                    <FaCheck />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
