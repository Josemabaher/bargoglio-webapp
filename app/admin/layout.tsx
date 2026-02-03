"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChartLine, FaUsers, FaCalendarAlt, FaStar, FaMap, FaCog, FaChartPie } from "react-icons/fa";

const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: FaChartLine },
    { name: "Insights", href: "/admin/insights", icon: FaChartPie },
    { name: "Shows", href: "/admin/shows", icon: FaCalendarAlt },
    { name: "Clientes", href: "/admin/crm", icon: FaUsers },
    { name: "Puntos", href: "/admin/points", icon: FaStar },
    { name: "Reservas", href: "/admin/reservations", icon: FaMap },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#121212] text-stone-200 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0a0a0a] border-r border-stone-800/50 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-stone-800/50">
                    <h1 className="text-2xl font-serif font-bold text-bargoglio-orange tracking-wide">
                        BARGOGLIO
                    </h1>
                    <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-bargoglio-orange/10 text-bargoglio-orange border-l-4 border-bargoglio-orange"
                                    : "text-stone-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? "text-bargoglio-orange" : ""}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800/50">
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-500 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <FaCog className="w-4 h-4" />
                        Configuración
                    </Link>
                    <p className="text-xs text-stone-700 mt-4 text-center">v1.0.0</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
