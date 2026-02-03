"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaSync } from 'react-icons/fa';
import SummaryCards from '../components/analytics/SummaryCards';
import RevenueChart from '../components/analytics/RevenueChart';
import OccupancyChart from '../components/analytics/OccupancyChart';
import HeatmapClock from '../components/analytics/HeatmapClock';
import AmbassadorList from '../components/analytics/AmbassadorList';
import ClientProfileDashboard from '../components/ClientProfileDashboard';

// Dynamic import of the button that contains all PDF logic
const DownloadReportButton = dynamic(
    () => import('../components/analytics/DownloadReportButton'),
    {
        ssr: false,
        loading: () => <button className="px-4 py-2 bg-charcoal-700 rounded-lg text-stone-500 text-sm font-bold cursor-wait">Cargando PDF...</button>
    }
);

export default function InsightsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/admin/analytics');
            if (!res.ok) throw new Error("Error fetching analytics");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los datos. Intente nuevamente.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <main className="min-h-screen bg-stone-950 text-stone-200 font-sans p-8 ml-64">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                        Insights de Negocio
                        <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-1 rounded border border-gold-500/30">BETA</span>
                    </h1>
                    <p className="text-stone-500 mt-1">Tablero de control estratégico para toma de decisiones.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-stone-300 rounded-lg border border-white/10 transition-all text-sm"
                    >
                        <FaSync className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Actualizando..." : "Refrescar Datos"}
                    </button>

                    {data && <DownloadReportButton data={data} />}
                </div>
            </div>

            {loading && !data ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-900/20 border border-red-500 text-red-500 p-6 rounded-xl text-center">
                    {error}
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* 1. Summary Cards */}
                    <SummaryCards data={data.revenue ? {
                        ticketAverage: data.revenue.ticketAverage,
                        newCustomers: data.loyalty.newCustomers,
                        projectedWeekly: data.revenue.projectedWeekly,
                        retentionRate: data.loyalty.retentionRate
                    } : null} />

                    {/* 2. Main Analytics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column (2/3 width) */}
                        <div className="lg:col-span-2 space-y-8">
                            <RevenueChart data={data.revenue.byMonth} />

                            <HeatmapClock
                                popularZones={data.heatmap.popularZones}
                                goldenHours={data.heatmap.goldenHours}
                            />
                        </div>

                        {/* Right Column (1/3 width) */}
                        <div className="space-y-8">
                            <OccupancyChart
                                occupancyPercent={data.occupancy.average}
                                lowDemandEvents={data.occupancy.lowDemandAlerts}
                            />

                            <AmbassadorList
                                users={data.loyalty.ambassadors}
                                onSelectUser={(u) => setSelectedUser({ uid: u.id, ...u })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {selectedUser && (
                <ClientProfileDashboard
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={fetchData}
                />
            )}
        </main>
    );
}
