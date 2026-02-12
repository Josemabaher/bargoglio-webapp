"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaImage, FaTimes, FaSpinner, FaCheck, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { db } from "@/src/lib/firebase/config";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export default function EditShowPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = decodeURIComponent(params.id as string);

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        zona1Price: "",
        zona2Price: "",
        zona3Price: "",
        category: "show",
        pricingType: "zones",
        generalPrice: "",
    });
    const [currentFlyerUrl, setCurrentFlyerUrl] = useState<string | null>(null);
    const [flyerFile, setFlyerFile] = useState<File | null>(null);
    const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load existing event data
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const eventRef = doc(db, 'events', eventId);
                const eventDoc = await getDoc(eventRef);

                if (eventDoc.exists()) {
                    const data = eventDoc.data();
                    setFormData({
                        title: data.name || '',
                        description: data.description || '',
                        date: data.date || '',
                        time: data.time || '',
                        zona1Price: data.zonesPrices?.[0]?.price?.toString() || '',
                        zona2Price: data.zonesPrices?.[1]?.price?.toString() || '',
                        zona3Price: data.zonesPrices?.[2]?.price?.toString() || '',
                        category: data.category || 'show',
                        pricingType: data.pricingType || (data.zonesPrices?.length > 0 ? 'zones' : 'general'),
                        generalPrice: data.generalPrice?.toString() || '',
                    });
                    if (data.flyerUrl) {
                        setCurrentFlyerUrl(data.flyerUrl);
                        setFlyerPreview(data.flyerUrl);
                    }
                } else {
                    setError("Evento no encontrado");
                }
            } catch (err) {
                console.error("Error fetching event:", err);
                setError("Error al cargar el evento");
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setFlyerFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setFlyerPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFlyerFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setFlyerPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error uploading image');
        }

        const data = await response.json();
        return data.url;
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.title || !formData.date || !formData.time) {
            setError("Por favor completá título, fecha y hora.");
            return;
        }

        if (formData.pricingType === 'zones' && (!formData.zona1Price || !formData.zona2Price || !formData.zona3Price)) {
            setError("Por favor completá los precios de todas las zonas.");
            return;
        }

        if (formData.pricingType === 'general' && !formData.generalPrice) {
            setError("Por favor completá el precio de la entrada general.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Upload new flyer if exists
            let flyerUrl = currentFlyerUrl || "";
            if (flyerFile) {
                flyerUrl = await uploadToCloudinary(flyerFile);
            }

            // Update event document
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, {
                name: formData.title,
                description: formData.description || "",
                date: formData.date,
                time: formData.time,
                flyerUrl: flyerUrl,
                updatedAt: Timestamp.now(),
                category: formData.category,
                pricingType: formData.pricingType,
                generalPrice: formData.pricingType === 'general' ? parseInt(formData.generalPrice) : 0,
                zonesPrices: [
                    { zone: "Zona 1", price: formData.pricingType === 'zones' ? parseInt(formData.zona1Price) : (formData.pricingType === 'general' ? parseInt(formData.generalPrice) : 0) },
                    { zone: "Zona 2", price: formData.pricingType === 'zones' ? parseInt(formData.zona2Price) : (formData.pricingType === 'general' ? parseInt(formData.generalPrice) : 0) },
                    { zone: "Zona 3", price: formData.pricingType === 'zones' ? parseInt(formData.zona3Price) : (formData.pricingType === 'general' ? parseInt(formData.generalPrice) : 0) },
                ],
            });

            setSuccess(true);

            // Redirect after 1.5 seconds
            setTimeout(() => {
                router.push('/admin/shows');
            }, 1500);

        } catch (err) {
            console.error('Error updating show:', err);
            setError(`Error al actualizar el show: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="w-8 h-8 text-bargoglio-orange animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/shows"
                    className="p-2 text-stone-400 hover:text-white transition-colors"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white">Editar Show</h1>
                    <p className="text-stone-500 mt-1">Modificá los datos del evento.</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-900/50 border border-green-500 rounded-xl p-4 flex items-center gap-3">
                    <FaCheck className="w-5 h-5 text-green-500" />
                    <p className="text-green-400">¡Show actualizado exitosamente! Redirigiendo...</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-xl p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Form */}
            <div className="bg-[#1a1a1a] border border-stone-800/50 rounded-xl p-8 space-y-8">

                {/* Category Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, category: "show" })}
                        className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${formData.category === "show"
                            ? "border-bargoglio-orange bg-bargoglio-orange/10 text-white"
                            : "border-stone-800 bg-[#121212] text-stone-500 hover:border-stone-600 hover:text-stone-300"
                            }`}
                    >
                        <span className="text-2xl">🎵</span>
                        <span className="font-bold uppercase tracking-widest text-sm">Agenda Show</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, category: "cultural" })}
                        className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${formData.category === "cultural"
                            ? "border-purple-500 bg-purple-500/10 text-white"
                            : "border-stone-800 bg-[#121212] text-stone-500 hover:border-stone-600 hover:text-stone-300"
                            }`}
                    >
                        <span className="text-2xl">🎭</span>
                        <span className="font-bold uppercase tracking-widest text-sm">Agenda Cultural</span>
                    </button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-400 mb-2">Título del Show</label>
                        <textarea
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: Jazz Night Especial"
                            rows={2}
                            className="w-full px-4 py-3 bg-[#121212] border border-stone-800/50 rounded-lg text-white placeholder-stone-600 focus:outline-none focus:border-bargoglio-orange/50 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Fecha</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-3 bg-[#121212] border border-stone-800/50 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Hora</label>
                        <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full px-4 py-3 bg-[#121212] border border-stone-800/50 rounded-lg text-white focus:outline-none focus:border-bargoglio-orange/50"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-400 mb-2">Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descripción del evento..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[#121212] border border-stone-800/50 rounded-lg text-white placeholder-stone-600 focus:outline-none focus:border-bargoglio-orange/50 resize-none"
                        />
                    </div>
                </div>

                {/* Pricing Configuration */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Configuración de Precios</h3>

                    {/* Pricing Type Selector */}
                    <div className="flex bg-[#121212] p-1 rounded-lg border border-stone-800 mb-6">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: "zones" })}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.pricingType === "zones"
                                ? "bg-stone-800 text-white shadow-sm"
                                : "text-stone-500 hover:text-stone-300"
                                }`}
                        >
                            Por Zonas
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: "general" })}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.pricingType === "general"
                                ? "bg-stone-800 text-white shadow-sm"
                                : "text-stone-500 hover:text-stone-300"
                                }`}
                        >
                            Entrada General
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: "free" })}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.pricingType === "free"
                                ? "bg-stone-800 text-white shadow-sm"
                                : "text-stone-500 hover:text-stone-300"
                                }`}
                        >
                            Gratis
                        </button>
                    </div>

                    {/* Pricing Inputs */}
                    {formData.pricingType === 'zones' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                            {[
                                { key: "zona1Price", label: "Zona 1 (VIP)", color: "border-yellow-500/50" },
                                { key: "zona2Price", label: "Zona 2 (Premium)", color: "border-purple-500/50" },
                                { key: "zona3Price", label: "Zona 3 (General)", color: "border-blue-500/50" },
                            ].map((zone) => (
                                <div key={zone.key}>
                                    <label className="block text-xs font-medium text-stone-500 mb-2">{zone.label}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                                        <input
                                            type="number"
                                            value={formData[zone.key as keyof typeof formData]}
                                            onChange={(e) => setFormData({ ...formData, [zone.key]: e.target.value })}
                                            placeholder="0"
                                            className={`w-full pl-8 pr-4 py-3 bg-[#121212] border ${zone.color} rounded-lg text-white placeholder-stone-600 focus:outline-none focus:border-bargoglio-orange/50`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {formData.pricingType === 'general' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-stone-400 mb-2">Precio Entrada General</label>
                            <div className="relative max-w-md">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-lg">$</span>
                                <input
                                    type="number"
                                    value={formData.generalPrice}
                                    onChange={(e) => setFormData({ ...formData, generalPrice: e.target.value })}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-3 bg-[#121212] border border-stone-700 rounded-lg text-white text-lg placeholder-stone-600 focus:outline-none focus:border-bargoglio-orange/50"
                                />
                            </div>
                            <p className="text-stone-500 text-sm mt-2">Este precio se aplicará a todas las ubicaciones.</p>
                        </div>
                    )}

                    {formData.pricingType === 'free' && (
                        <div className="bg-stone-800/30 border border-stone-800 rounded-lg p-6 text-center animate-fade-in">
                            <span className="text-3xl mb-2 block">🎟️</span>
                            <h4 className="text-white font-medium">Evento Gratuito</h4>
                            <p className="text-stone-500 text-sm mt-1">Los clientes podrán reservar su lugar sin costo.</p>
                        </div>
                    )}
                </div>

                {/* Flyer Upload */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Flyer del Evento</h3>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${isDragging
                            ? "border-bargoglio-orange bg-bargoglio-orange/10"
                            : "border-stone-700 hover:border-stone-600"
                            }`}
                    >
                        {flyerPreview ? (
                            <div className="relative">
                                <img
                                    src={flyerPreview}
                                    alt="Flyer preview"
                                    className="max-h-64 mx-auto rounded-lg"
                                />
                                <button
                                    onClick={() => {
                                        setFlyerPreview(null);
                                        setFlyerFile(null);
                                        setCurrentFlyerUrl(null);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <FaImage className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                                <p className="text-stone-400 mb-2">
                                    Arrastrá el flyer acá o{" "}
                                    <label className="text-bargoglio-orange cursor-pointer hover:underline">
                                        buscá en tu computadora
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="text-stone-600 text-sm">PNG, JPG hasta 5MB</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link
                        href="/admin/shows"
                        className="px-6 py-3 bg-stone-800 text-stone-300 rounded-lg font-medium hover:bg-stone-700 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-3 bg-bargoglio-orange text-white rounded-lg font-medium hover:bg-bargoglio-orange/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <FaSpinner className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
