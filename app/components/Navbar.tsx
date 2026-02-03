"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/src/lib/context/AuthContext";
import { FaFacebookF, FaInstagram, FaXTwitter, FaChevronRight } from "react-icons/fa6";
import { FaRegUserCircle } from "react-icons/fa";
import { IoLogInOutline } from "react-icons/io5";
import Image from 'next/image';

export default function Navbar() {
    const { user, userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Inicio", href: "/" },
        { name: "Agenda", href: "/#agenda" },
        { name: "Menú", href: "/#menu" },
        { name: "Contacto", href: "/#contacto" },
    ];

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "h-20" : "h-24"}`}>
            {/* Background - Solid Black as requested */}
            <div className="absolute inset-0 bg-black shadow-2xl transition-opacity duration-300 border-b border-white/5"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                {/* 1. Left: Logo */}
                <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/Bargoglio-Logo-Circulo-Transparente-02.png"
                            alt="Bargoglio"
                            width={50}
                            height={50}
                            className="hover:rotate-12 transition-transform duration-500"
                        />
                    </Link>
                </div>

                {/* 2. Center: Navigation Links */}
                <div className="hidden md:flex flex-1 items-center justify-center space-x-6 lg:space-x-10 px-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-white hover:text-bargoglio-red text-xs lg:text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 relative group text-nowrap"
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-bargoglio-red transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    ))}
                </div>

                {/* 3. Right: Socials & Login/Profile */}
                <div className="hidden md:flex items-center space-x-6">
                    {/* Social Icons */}
                    <div className="flex items-center space-x-4 border-r border-white/10 pr-6">
                        <a href="#" className="text-stone-400 hover:text-white transition-transform duration-300 hover:scale-110">
                            <FaXTwitter size={18} />
                        </a>
                        <a href="#" className="text-stone-400 hover:text-[#1877F2] transition-transform duration-300 hover:scale-110">
                            <FaFacebookF size={18} />
                        </a>
                        <a href="#" className="text-stone-400 hover:text-[#C13584] transition-transform duration-300 hover:scale-110">
                            <FaInstagram size={18} />
                        </a>
                    </div>

                    {/* Auth Area */}
                    {user ? (
                        <Link
                            href="/perfil"
                            className="flex items-center space-x-3 text-stone-300 hover:text-white transition-all duration-300 group"
                        >
                            <div className="text-right hidden lg:block">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500 group-hover:text-bargoglio-red transition-colors">Mi Perfil</p>
                                <p className="text-xs font-bold text-white max-w-[120px] truncate">{userProfile?.nombre || user.displayName || "Socio"}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-bargoglio-red/50 transition-all">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <FaRegUserCircle size={22} className="text-stone-400 group-hover:text-white" />
                                )}
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-6">
                            <Link
                                href="/club"
                                className="px-6 py-2.5 bg-bargoglio-red text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 hover:scale-105 animate-pulse-slow"
                            >
                                UNITE AL CLUB BARGOGLIO
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center space-x-2 text-stone-300 hover:text-bargoglio-red transition-colors duration-300 group"
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">Login</span>
                                <IoLogInOutline size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        type="button"
                        className="bg-transparent inline-flex items-center justify-center p-2 rounded-md text-stone-400 hover:text-white focus:outline-none"
                    >
                        <span className="sr-only">Open main menu</span>
                        {!isOpen ? (
                            <svg className="block h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        ) : (
                            <svg className="block h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-stone-950/95 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-500 ease-in-out origin-top ${isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}`}>
                <div className="px-4 pt-4 pb-6 space-y-2 flex flex-col items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-stone-300 hover:text-bargoglio-red block px-3 py-3 text-lg font-medium uppercase tracking-[0.2em] transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}

                    <div className="w-full pt-4 border-t border-white/5">
                        {user ? (
                            <Link
                                href="/perfil"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center justify-between px-6 py-4 bg-stone-900 border border-white/5 rounded-xl text-white transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-bargoglio-red/10 flex items-center justify-center text-bargoglio-red">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <FaRegUserCircle size={20} />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white leading-none">{userProfile?.nombre || "Socio"}</p>
                                        <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-widest font-bold">Ver Mi Perfil</p>
                                    </div>
                                </div>
                                <FaChevronRight className="w-3 h-3 text-stone-600" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="block w-full text-center px-8 py-4 bg-bargoglio-red text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95"
                            >
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
