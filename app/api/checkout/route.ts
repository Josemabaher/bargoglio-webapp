import { NextRequest, NextResponse } from 'next/server';
import MercadoPagoConfig, { Preference } from 'mercadopago';
import { db } from '@/src/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// Initialize MP Client (Sandbox)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN' });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, payer, eventId, seatIds, serviceFee } = body;

        console.log("Creating Preference - Incoming Body:", JSON.stringify(body, null, 2));

        // Helper to sanitize price
        const sanitizePrice = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            // Remove any non-numeric chars except dot
            const cleanStr = String(val).replace(/[^0-9.]/g, '');
            const parsed = parseFloat(cleanStr);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Ensure URL is absolute and valid
        let URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        if (!URL.startsWith('http')) {
            URL = `https://${URL}`;
        }

        console.log("Using Base URL:", URL);

        const preference = new Preference(client);

        // Sanitize items with strict validation
        const sanitizedItems = items.map((item: any) => {
            const cleanPrice = sanitizePrice(item.unit_price || item.price);
            return {
                title: String(item.title).substring(0, 250), // Standard limit
                unit_price: Number(cleanPrice.toFixed(2)),
                quantity: Math.max(1, parseInt(item.quantity) || 1),
                currency_id: 'ARS' // Explicitly set currency
            };
        });

        // Add Service Fee ensuring it matches currency
        const finalItems = [...sanitizedItems];
        if (serviceFee && serviceFee > 0) {
            finalItems.push({
                title: "Servicio Ticketera (8%)",
                unit_price: Number(sanitizePrice(serviceFee).toFixed(2)),
                quantity: 1,
                currency_id: 'ARS'
            });
        }

        console.log("Sanitized Items for MP:", JSON.stringify(finalItems, null, 2));

        const preferenceBody = {
            items: finalItems,
            payer: {
                email: payer.email,
                name: payer.nombre,
                surname: payer.apellido,
                // identification: { type: 'DNI', number: payer.dni } // Optional, good for MP
            },
            back_urls: {
                success: `${URL.replace(/\/$/, '')}/checkout/success`,
                failure: `${URL.replace(/\/$/, '')}/checkout/failure`,
                pending: `${URL.replace(/\/$/, '')}/checkout/pending`,
            },
            // auto_return: 'approved', // Disabled temporarily to debug back_url error
            metadata: {
                event_id: eventId,
                seat_ids: seatIds ? seatIds.join(',') : '', // Handle empty array
                user_id: payer.uid || 'guest', // 'guest' for non-logged users
                is_guest: payer.isGuest ? 'true' : 'false',
                guest_data: payer.isGuest ? JSON.stringify({
                    nombre: payer.nombre,
                    apellido: payer.apellido,
                    dni: payer.dni,
                    email: payer.email,
                    telefono: payer.telefono,
                    direccion: payer.direccion,
                    provincia: payer.provincia,
                    fecha_nacimiento: payer.fecha_nacimiento
                }) : ''
            },
            notification_url: `${URL}/api/webhooks/mercadopago`
        };

        console.log("Preference Body:", JSON.stringify(preferenceBody, null, 2));

        const result = await preference.create({
            body: preferenceBody as any
        });

        return NextResponse.json({ id: result.id, url: result.init_point });
    } catch (error: any) {
        console.error("Error creating preference:", error);
        return NextResponse.json({
            error: error.message || "Error creating payment preference",
            details: error.cause || error
        }, { status: 500 });
    }
}
