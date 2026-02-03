"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HeatmapProps {
    popularZones: { name: string; value: number }[];
    goldenHours: { hour: number; count: number }[];
}

export default function HeatmapClock({ popularZones, goldenHours }: HeatmapProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zones */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg">
                <h3 className="text-white font-serif font-bold mb-4">Zonas Más Calientes</h3>
                <div className="space-y-4">
                    {popularZones.map((zone, idx) => (
                        <div key={zone.name} className="relative">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-white font-bold">#{idx + 1} {zone.name}</span>
                                <span className="text-gold-400">{zone.value} reservas</span>
                            </div>
                            <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gold-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(zone.value / (popularZones[0]?.value || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Golden Hours Chart */}
            <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg">
                <h3 className="text-white font-serif font-bold mb-4">Horarios de Oro (Ventas Web)</h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goldenHours}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                labelFormatter={(v) => `${v}:00 hs`}
                            />
                            <Area type="monotone" dataKey="count" stroke="#d4af37" fillOpacity={1} fill="url(#colorCount)" />
                            <XAxis dataKey="hour" stroke="#666" fontSize={10} tickFormatter={(v) => `${v}h`} interval={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-stone-500 mt-2 text-center">Hora del día en que los clientes completan el checkout.</p>
            </div>
        </div>
    )
}
