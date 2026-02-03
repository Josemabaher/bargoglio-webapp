'use client';

/**
 * Admin Seed Page - Execute user seed from browser
 * Navigate to /admin/seed to run the seed script
 */

import { useState } from 'react';
import { seedUsers, SEED_USERS } from '@/scripts/seed-users';
import { seedShowsAndReservations, SEED_SHOWS } from '@/scripts/seed-shows';
import { seedTestShow } from '@/scripts/seed-test-show';

export default function AdminSeedPage() {
    const [loading, setLoading] = useState(false);
    const [loadingShows, setLoadingShows] = useState(false);
    const [loadingTestShow, setLoadingTestShow] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showsResult, setShowsResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testShowResult, setTestShowResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSeed = async () => {
        if (!confirm('¿Estás seguro de que querés crear los 20 usuarios de prueba?')) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await seedUsers();
            setResult(res);
        } catch (error) {
            setResult({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSeedShows = async () => {
        if (!confirm('¿Estás seguro de que querés crear 5 shows con reservas de prueba?')) {
            return;
        }

        setLoadingShows(true);
        setShowsResult(null);

        try {
            const res = await seedShowsAndReservations();
            setShowsResult(res);
        } catch (error) {
            setShowsResult({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingShows(false);
        }
    };

    const handleSeedTestShow = async () => {
        if (!confirm('¿Crear el show de prueba con reservas específicas? Esto borrará TODOS los shows y reservas anteriores.')) {
            return;
        }

        setLoadingTestShow(true);
        setTestShowResult(null);

        try {
            const res = await seedTestShow();
            setTestShowResult(res);
        } catch (error) {
            setTestShowResult({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingTestShow(false);
        }
    };

    // Get birthday users
    const birthdayUsers = SEED_USERS.filter(u => {
        const [m, d] = u.birthDate.split('-').map(Number);
        return (m === 1 && d >= 29) || (m === 2 && d <= 5);
    });

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🌱 Seed de Datos</h1>

                {/* Shows Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">🎭 Shows y Reservas (Aleatorio)</h2>
                    <ul className="space-y-2 text-gray-300 mb-4">
                        <li>📅 <strong>Total shows:</strong> {SEED_SHOWS.length}</li>
                        {SEED_SHOWS.map(show => (
                            <li key={show.id} className="text-sm text-gray-400">
                                • {show.name} - {show.date}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleSeedShows}
                        disabled={loadingShows}
                        className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${loadingShows
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                    >
                        {loadingShows ? '⏳ Creando shows...' : '🎭 Crear 5 Shows con Reservas'}
                    </button>
                    {showsResult && (
                        <div className={`mt-4 p-4 rounded-lg ${showsResult.success ? 'bg-green-800' : 'bg-red-800'}`}>
                            <p>{showsResult.message}</p>
                        </div>
                    )}
                </div>

                {/* Test Show Section - Specific Data */}
                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">🧪 Show de Prueba (Datos Controlados)</h2>
                    <p className="text-gray-300 text-sm mb-4">
                        Crea UN SOLO show con reservas específicas para verificar la funcionalidad.
                        <strong className="text-orange-400"> Borrará todos los shows y reservas anteriores.</strong>
                    </p>
                    <ul className="text-sm text-gray-400 mb-4 space-y-1">
                        <li>🔴 <strong>20 lugares ocupados</strong> (7 reservas confirmadas)</li>
                        <li>🟡 <strong>8 lugares reservados</strong> (4 reservas pendientes)</li>
                        <li>🟢 <strong>49 lugares disponibles</strong></li>
                    </ul>
                    <button
                        onClick={handleSeedTestShow}
                        disabled={loadingTestShow}
                        className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${loadingTestShow
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        {loadingTestShow ? '⏳ Creando show de prueba...' : '🧪 Crear Show de Prueba'}
                    </button>
                    {testShowResult && (
                        <div className={`mt-4 p-4 rounded-lg whitespace-pre-wrap ${testShowResult.success ? 'bg-green-800' : 'bg-red-800'}`}>
                            <p>{testShowResult.message}</p>
                        </div>
                    )}
                </div>

                {/* Users Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">👥 Usuarios de Prueba</h2>
                    <ul className="space-y-2 text-gray-300">
                        <li>📊 <strong>Total usuarios:</strong> {SEED_USERS.length}</li>
                        <li>🥇 <strong>Oro:</strong> {SEED_USERS.filter(u => u.nivel_cliente === 'Oro').length}</li>
                        <li>🥈 <strong>Plata:</strong> {SEED_USERS.filter(u => u.nivel_cliente === 'Plata').length}</li>
                        <li>🥉 <strong>Bronce:</strong> {SEED_USERS.filter(u => u.nivel_cliente === 'Bronce').length}</li>
                    </ul>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">🎂 Cumpleaños esta semana (29 ene - 5 feb)</h2>
                    <ul className="space-y-2 text-gray-300">
                        {birthdayUsers.map(u => (
                            <li key={u.uid}>
                                <span className="text-yellow-400">{u.birthDate}</span> - {u.nombre} {u.apellido} ({u.nivel_cliente})
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${loading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    {loading ? '⏳ Creando usuarios...' : '🚀 Ejecutar Seed (20 usuarios)'}
                </button>

                {result && (
                    <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-800' : 'bg-red-800'
                        }`}>
                        <p className="text-lg">{result.message}</p>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Lista completa de usuarios</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-2 text-left">Nombre</th>
                                    <th className="p-2 text-left">Email</th>
                                    <th className="p-2 text-left">Cumple</th>
                                    <th className="p-2 text-left">Puntos</th>
                                    <th className="p-2 text-left">Nivel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SEED_USERS.map((user, i) => (
                                    <tr key={user.uid} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                                        <td className="p-2">{user.nombre} {user.apellido}</td>
                                        <td className="p-2 text-gray-400">{user.email}</td>
                                        <td className="p-2">{user.birthDate}</td>
                                        <td className="p-2">{user.puntos}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-xs ${user.nivel_cliente === 'Oro' ? 'bg-yellow-600' :
                                                user.nivel_cliente === 'Plata' ? 'bg-gray-500' :
                                                    'bg-amber-700'
                                                }`}>
                                                {user.nivel_cliente}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
