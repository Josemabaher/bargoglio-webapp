"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OccupancyChartProps {
    occupancyPercent: number;
    lowDemandEvents: any[];
}

export default function OccupancyChart({ occupancyPercent, lowDemandEvents }: OccupancyChartProps) {
    const data = [
        { name: 'Ocupado', value: occupancyPercent },
        { name: 'Libre', value: 100 - occupancyPercent },
    ];
    const COLORS = ['#d4af37', '#333'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center">
                <h3 className="text-white font-serif font-bold mb-2">Ocupación Promedio</h3>
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-white">{occupancyPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Low Demand Alerts */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-serif font-bold">Alertas de Baja Demanda</h3>
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-400/20">Acción Requerida</span>
                </div>

                {lowDemandEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-stone-500 text-sm italic">
                        No hay alertas activas. ¡Buen trabajo!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lowDemandEvents.map((evt) => (
                            <div key={evt.id} className="p-3 bg-red-500/5 border-l-2 border-red-500 rounded-r flex justify-between items-center">
                                <div>
                                    <p className="text-white text-sm font-bold truncate max-w-[150px]">{evt.title}</p>
                                    <p className="text-xs text-stone-500">{new Date(evt.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-red-400">{evt.occupancy}%</span>
                                    <p className="text-[10px] text-stone-500 uppercase">Ocupación</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
