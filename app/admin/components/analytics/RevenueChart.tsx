"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RevenueChartProps {
    data: { name: string; value: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
    if (!data || data.length === 0) return <p className="text-stone-500">Sin datos de ingresos disponibles.</p>;

    return (
        <div className="bg-charcoal-900 border border-white/5 rounded-xl p-6 shadow-lg h-96">
            <h3 className="text-white font-serif font-bold mb-6">Tendencia de Ingresos</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#d4af37' }}
                        formatter={(value: number | undefined) => [`$${value?.toLocaleString() ?? '0'}`, 'Ingresos']}
                    />
                    <Bar dataKey="value" fill="#d4af37" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
