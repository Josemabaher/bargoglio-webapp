"use client";

import { useState, useRef } from 'react';
import { FaCloudArrowUp, FaCheck, FaSpinner, FaEye } from 'react-icons/fa6';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

export default function MenuManagementPage() {
    const [uploading, setUploading] = useState(false);
    const [currentMenuUrl, setCurrentMenuUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load current menu URL from Firestore
    const loadCurrentMenu = async () => {
        try {
            const configDoc = await getDoc(doc(db, 'config', 'menu'));
            if (configDoc.exists()) {
                setCurrentMenuUrl(configDoc.data().url);
            }
        } catch (e) {
            console.error("Error loading menu config:", e);
        }
    };

    // Upload to Cloudinary (supports images and PDFs)
    const uploadToCloudinary = async (file: File): Promise<string> => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary no está configurado");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "bargoglio/menu");

        // Use /auto/upload for any file type (image, pdf, etc)
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error subiendo archivo");
        }

        const data = await response.json();
        return data.secure_url;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError("Solo se permiten imágenes (JPG, PNG, WEBP) o PDF");
            return;
        }

        // Show preview for images
        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }

        setError(null);
        setSuccess(false);
        setUploading(true);

        try {
            // 1. Upload to Cloudinary
            const url = await uploadToCloudinary(file);

            // 2. Save URL to Firestore
            await setDoc(doc(db, 'config', 'menu'), {
                url: url,
                updatedAt: new Date(),
                filename: file.name
            });

            setCurrentMenuUrl(url);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);

        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "Error al subir el archivo");
        } finally {
            setUploading(false);
        }
    };

    // Load on mount
    useState(() => {
        loadCurrentMenu();
    });

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Gestión del Menú</h2>

            {/* Current Menu */}
            <div className="bg-charcoal-800 rounded-xl p-6 mb-6">
                <h3 className="text-stone-400 text-sm uppercase tracking-wider mb-4">Menú Actual</h3>
                {currentMenuUrl ? (
                    <div className="flex items-center justify-between">
                        <span className="text-gold-400 text-sm truncate max-w-xs">
                            {currentMenuUrl.split('/').pop()}
                        </span>
                        <a
                            href={currentMenuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-white text-sm"
                        >
                            <FaEye /> Ver Menú
                        </a>
                    </div>
                ) : (
                    <p className="text-stone-500 italic">No hay menú configurado</p>
                )}
            </div>

            {/* Upload Section */}
            <div className="bg-charcoal-800 rounded-xl p-6">
                <h3 className="text-stone-400 text-sm uppercase tracking-wider mb-4">Subir Nuevo Menú</h3>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                        transition-all duration-300
                        ${uploading ? 'border-gold-500 bg-gold-500/10' : 'border-stone-600 hover:border-gold-500 hover:bg-white/5'}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <FaSpinner className="text-4xl text-gold-400 animate-spin" />
                            <p className="text-stone-300">Subiendo archivo...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <FaCloudArrowUp className="text-4xl text-stone-500" />
                            <div>
                                <p className="text-stone-300 mb-1">Arrastra un archivo o haz clic para seleccionar</p>
                                <p className="text-stone-500 text-sm">JPG, PNG, WEBP o PDF (max 10MB)</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview */}
                {previewUrl && (
                    <div className="mt-6">
                        <h4 className="text-stone-400 text-sm mb-2">Vista previa:</h4>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-64 rounded-lg border border-stone-700"
                        />
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mt-6 p-4 bg-green-900/50 border border-green-500 rounded-lg flex items-center gap-3">
                        <FaCheck className="text-green-400" />
                        <span className="text-green-300">¡Menú actualizado correctamente!</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                        <span className="text-red-300">{error}</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <p className="mt-6 text-stone-500 text-sm text-center">
                El menú subido se mostrará automáticamente en el botón "VER MENÚ" de la página principal.
            </p>
        </div>
    );
}
