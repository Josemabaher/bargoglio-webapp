"use client";

import { UserProfile } from "@/src/types";

interface ClientTableProps {
    clients: UserProfile[];
    onSelectClient: (client: UserProfile) => void;
}

const getTierBadge = (tier: string) => {
    switch (tier) {
        case "Oro":
            return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
        case "Plata":
            return "bg-gray-400/20 text-gray-300 border border-gray-400/30";
        case "Bronce":
            return "bg-amber-700/20 text-amber-600 border border-amber-700/30";
        default:
            return "bg-stone-700/20 text-stone-400";
    }
};

export default function ClientTable({ clients, onSelectClient }: ClientTableProps) {
    return (
        <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-stone-800/50">
                        <th className="text-left p-4 text-stone-500 text-sm font-medium uppercase tracking-wider">Nombre</th>
                        <th className="text-left p-4 text-stone-500 text-sm font-medium uppercase tracking-wider">Email</th>
                        <th className="text-left p-4 text-stone-500 text-sm font-medium uppercase tracking-wider">Teléfono</th>
                        <th className="text-left p-4 text-stone-500 text-sm font-medium uppercase tracking-wider">Nivel</th>
                        <th className="text-left p-4 text-stone-500 text-sm font-medium uppercase tracking-wider">Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-stone-500">
                                No se encontraron clientes.
                            </td>
                        </tr>
                    ) : (
                        clients.map((client) => (
                            <tr
                                key={client.uid}
                                onClick={() => onSelectClient(client)}
                                className="border-b border-stone-800/30 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                                <td className="p-4">
                                    <span className="font-medium text-white">
                                        {client.nombre} {client.apellido}
                                    </span>
                                </td>
                                <td className="p-4 text-stone-400">{client.email}</td>
                                <td className="p-4 text-stone-400">{client.telefono}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTierBadge(client.nivel_cliente)}`}>
                                        {client.nivel_cliente}
                                    </span>
                                </td>
                                <td className="p-4 text-bargoglio-orange font-medium">
                                    {client.points?.toLocaleString() || 0}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
