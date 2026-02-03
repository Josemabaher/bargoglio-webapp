"use client";

import Link from "next/link";
import { FaCalendarAlt } from "react-icons/fa";
import { formatDate } from "@/src/lib/utils/format";
import Image from "next/image";

interface AgendaCardProps {
    id: string; // Add ID prop
    title: string;
    date: string;
    image: string;
    description: string;
    pricingType?: 'zones' | 'general' | 'free';
    price?: string;
}

export default function AgendaCard({ id, title, date, image, description, price, pricingType }: AgendaCardProps) {
    const isFree = pricingType === 'free' || price === 'Gratis';
    const isGeneral = pricingType === 'general' || (price && price.startsWith('General:'));

    return (
        <Link href={`/events/${id}`} className="block">
            <div className="group w-full rounded-xl bg-charcoal-900 shadow-xl overflow-hidden hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300">
                {/* Image Section */}
                <div className="relative w-full h-[250px] overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col gap-2">
                    {/* Date */}
                    <div className="self-start px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-bold uppercase tracking-widest mb-2 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                        {formatDate(date)}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-serif font-bold text-stone-100 group-hover:text-gold-400 transition-colors duration-300 leading-tight whitespace-pre-wrap">
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="text-stone-400 text-sm line-clamp-2 font-light leading-relaxed my-2 whitespace-pre-wrap">
                        {description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                        {isFree ? (
                            <div className="text-xs uppercase tracking-widest text-stone-300">
                                <span className="text-green-500 font-bold text-lg">ENTRADA LIBRE</span>
                            </div>
                        ) : isGeneral ? (
                            <div className="text-xs uppercase tracking-widest text-stone-300">
                                <span className="text-bargoglio-red font-bold text-lg">{price?.replace('General:', '').replace('$', '') ? `$${price?.replace('General:', '').replace('$', '')}` : price}</span>
                            </div>
                        ) : price && (
                            <div className="text-xs uppercase tracking-widest text-stone-300">
                                Desde <span className="text-bargoglio-red font-bold text-lg ml-1">{price}</span>
                            </div>
                        )}
                    </div>

                    {/* Button */}
                    {!isFree && (
                        <button className="w-full py-3 bg-bargoglio-red hover:bg-[#8a1612] text-stone-100 font-bold uppercase tracking-[0.2em] text-xs rounded transition-all duration-300 shadow-lg hover:shadow-red-900/40 mt-4">
                            Comprar Entradas
                        </button>
                    )}
                </div>
            </div>
        </Link>
    );
}
