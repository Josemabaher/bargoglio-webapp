import { FaDollarSign, FaUserPlus, FaCalendarCheck, FaChartLine } from 'react-icons/fa';

interface SummaryCardsProps {
    data: {
        ticketAverage: number;
        newCustomers: number;
        projectedWeekly: number;
        retentionRate: number;
    } | null; // Use null to show loading state if needed, though mostly parent handles it
}

export default function SummaryCards({ data }: SummaryCardsProps) {
    if (!data) return <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl"></div>)}
    </div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Ticket Promedio */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest">Ticket Promedio</h3>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <FaDollarSign />
                    </div>
                </div>
                <div className="text-3xl font-serif font-bold text-white">
                    ${Math.round(data.ticketAverage).toLocaleString()}
                </div>
                <p className="text-xs text-stone-500 mt-2">Promedio por compra</p>
            </div>

            {/* Nuevos Clientes */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest">Nuevos Clientes</h3>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <FaUserPlus />
                    </div>
                </div>
                <div className="text-3xl font-serif font-bold text-white">
                    {data.newCustomers}
                </div>
                <p className="text-xs text-stone-500 mt-2">Últimos 30 días</p>
            </div>

            {/* Proyección Semanal */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest">Proyección</h3>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <FaCalendarCheck />
                    </div>
                </div>
                <div className="text-3xl font-serif font-bold text-white">
                    ${data.projectedWeekly.toLocaleString()}
                </div>
                <p className="text-xs text-stone-500 mt-2">Ingresos futuros (Reservas activas)</p>
            </div>

            {/* Retención */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest">Retención</h3>
                    <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-400">
                        <FaChartLine />
                    </div>
                </div>
                <div className="text-3xl font-serif font-bold text-white">
                    {data.retentionRate}%
                </div>
                <p className="text-xs text-stone-500 mt-2">Clientes recurrentes ({'>'}1 visita)</p>
            </div>
        </div>
    );
}
