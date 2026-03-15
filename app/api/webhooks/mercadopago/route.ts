import { NextRequest, NextResponse } from 'next/server';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import { adminAuth, adminDb } from '@/src/lib/firebase/admin'; // Use Admin SDK
import { sendTicketEmail } from '@/src/lib/email/sender';
import { FieldValue } from 'firebase-admin/firestore';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN' });

/**
 * Helper to normalize string/array input from MP metadata
 */
function parseMetadataField(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    return String(value).split(',').map(s => s.trim()).filter(s => s);
}

export async function POST(req: NextRequest) {
    try {
        const url_params = new URL(req.url).searchParams;
        const topic = url_params.get('topic') || url_params.get('type');
        const id = url_params.get('id') || url_params.get('data.id');

        if (topic === 'payment' && id) {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: id });

            if (paymentData.status === 'approved') {
                const { metadata } = paymentData;
                console.log("[Webhook] Metadata:", JSON.stringify(metadata, null, 2));

                const { event_id, is_guest, guest_data } = metadata;
                let { user_id } = metadata;

                // Fix: Parse seat_ids carefully from metadata
                const seatList = parseMetadataField(metadata.seat_ids);
                console.log("[Webhook] Seats to block:", seatList);

                // ==========================
                // 1. GUEST ACCOUNT HANDLING
                // ==========================
                const isGuest = String(is_guest) === 'true';
                let activationLink: string | null = null;
                
                console.log(`[Webhook] isGuest flag: ${isGuest}, guest_data present: ${!!guest_data}`);

                if (isGuest && guest_data) {
                    try {
                        const guestInfo = typeof guest_data === 'string' ? JSON.parse(guest_data) : guest_data;
                        const email = guestInfo.email;
                        
                        console.log(`[Webhook] Processing guest registration for email: ${email}`);

                        // Check if auth user exists
                        let uid;
                        let isNewUser = false;

                        try {
                            const userRecord = await adminAuth.getUserByEmail(email);
                            uid = userRecord.uid;
                            console.log("[Webhook] Found existing Auth user:", uid);
                        } catch (e: any) {
                            if (e.code === 'auth/user-not-found') {
                                // Create new Auth User
                                const newUser = await adminAuth.createUser({
                                    email: email,
                                    emailVerified: true,
                                    displayName: `${guestInfo.nombre} ${guestInfo.apellido}`,
                                    disabled: false
                                });
                                uid = newUser.uid;
                                isNewUser = true;
                                console.log("[Webhook] Created new Auth user:", uid);
                            } else {
                                throw e;
                            }
                        }

                        // Use this UID for everything
                        user_id = uid;

                        // Create/Update Firestore User Doc (with Admin SDK to bypass rules)
                        const userRef = adminDb.collection('users').doc(uid);
                        
                        // Check if doc exists to catch edge case where Auth user exists but Firestore doc is missing
                        const docSnap = await userRef.get();
                        const isNewToClub = !docSnap.exists;

                        // Using set with merge to ensure we don't overwrite existing critical data but do update contact info if provided
                        await userRef.set({
                            email: email,
                            nombre: guestInfo.nombre || '',
                            apellido: guestInfo.apellido || '',
                            dni: guestInfo.dni || '',
                            telefono: guestInfo.telefono || '',
                            direccion: guestInfo.direccion || '',
                            provincia: guestInfo.provincia || '',
                            fecha_nacimiento: guestInfo.fecha_nacimiento || '', // Storing as string or whatever passed. Admin SDK doesn't need client Timestamp conversion usually
                            role: 'user', // Default role
                            updatedAt: new Date()
                        }, { merge: true });
                        
                        // If brand new user OR missing from Firestore, set creation fields
                        if (isNewUser || isNewToClub) {
                            await userRef.set({
                                createdAt: docSnap.exists ? docSnap.data()?.createdAt : new Date(),
                                points: 500, // Grant 500 initial points
                                nivel_cliente: 'Bronce'
                            }, { merge: true });
                        }

                        // ALWAYS trigger Firebase password reset email for guest checkouts
                        // Firebase sends this from Google's own servers (bypasses DonWeb)
                        // Safe to call even for existing users - they'll just get a reset link
                        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
                        console.log("[Webhook] Triggering Firebase password reset for guest:", email, "API key available:", !!apiKey);
                        if (apiKey) {
                            try {
                                const fbResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        requestType: 'PASSWORD_RESET',
                                        email: email,
                                    })
                                });
                                const fbResult = await fbResponse.json();
                                console.log("[Webhook] Firebase sendOobCode response:", fbResponse.status, JSON.stringify(fbResult));
                                if (!fbResponse.ok) {
                                    console.error("[Webhook] Firebase sendOobCode error:", fbResult);
                                }
                            } catch (emailErr) {
                                console.error("[Webhook] Failed to call Firebase sendOobCode:", emailErr);
                            }
                        } else {
                            console.error("[Webhook] NEXT_PUBLIC_FIREBASE_API_KEY not found in env");
                        }

                    } catch (err) {
                        console.error("[Webhook] Guest handling error:", err);
                        // Fallback: keep user_id as 'guest' if critical failure, OR proceed with what we have? 
                        // If we failed to get a UID, we can't assign seats to a specific user properly.
                        // But let's proceed best effort.
                    }
                }

                // Ensure we have a valid user_id (if not guest flow)
                if (!user_id) user_id = 'guest_unknown';

                // ==========================
                // 2. SEAT BLOCKING (ADMIN)
                // ==========================
                if (seatList.length > 0) {
                    console.log(`[Webhook] Locking ${seatList.length} seats for user ${user_id}...`);
                    const batch = adminDb.batch();

                    for (const seatId of seatList) {
                        // Path: events/{eventId}/seats/{seatId}
                        const seatRef = adminDb.collection('events').doc(event_id).collection('seats').doc(seatId);
                        batch.update(seatRef, {
                            status: 'occupied',
                            reservedBy: user_id,
                            updatedAt: new Date()
                        });
                    }

                    await batch.commit();
                    console.log("[Webhook] Seats locked successfully.");
                }

                // ==========================
                // 3. POINTS & STATS
                // ==========================
                const amount = paymentData.transaction_amount || 0;

                // Fetch dynamic points setting
                let pointsRatio = 1000; // Default
                try {
                    const settingsDoc = await adminDb.collection('settings').doc('general').get();
                    if (settingsDoc.exists) {
                        const sData = settingsDoc.data();
                        if (sData?.pesosPerPoint) {
                            pointsRatio = Number(sData.pesosPerPoint);
                        }
                    }
                } catch (e) {
                    console.error("Error fetching points settings:", e);
                }

                const points = Math.floor(amount / pointsRatio);

                if (user_id && user_id !== 'guest_unknown') {
                    const userRef = adminDb.collection('users').doc(user_id);
                    // Admin SDK increment
                    await userRef.update({
                        points: FieldValue.increment(points),
                        totalSpent: FieldValue.increment(amount),
                        visitCount: FieldValue.increment(1),
                        lastVisit: new Date(),
                        ultima_visita: new Date()
                    }).catch(e => console.log("Points/Stats update warning:", e));
                }

                // ==========================
                // 4. CREATE RESERVATION
                // ==========================
                // Fetch event details needed for reservation/email
                // Fallback to webhook metadata if eventDoc fails to load
                const eventDoc = await adminDb.collection('events').doc(event_id).get();
                const eventData = eventDoc.data() || {};
                const eventTitle = metadata.event_title || eventData.name || eventData.title || 'Evento';
                
                // Determine the best email to send the ticket to
                let contactEmail = paymentData.payer?.email;
                if (isGuest && guest_data) {
                    const guestInfo = typeof guest_data === 'string' ? JSON.parse(guest_data) : guest_data;
                    if (guestInfo.email) contactEmail = guestInfo.email;
                } else if (user_id && user_id !== 'guest_unknown') {
                    const uDoc = await adminDb.collection('users').doc(user_id).get();
                    if (uDoc.exists) {
                        const uData = uDoc.data();
                        if (uData?.email) contactEmail = uData.email;
                    }
                }

                const reservationRef = await adminDb.collection('reservations').add({
                    eventId: event_id,
                    eventName: eventTitle,
                    userId: user_id,
                    seatIds: seatList,
                    amount: amount,
                    status: 'confirmed',
                    paymentId: id,
                    checkInStatus: 'pending',
                    createdAt: new Date(),
                    payerEmail: contactEmail
                });

                // 5.5 WRITE TO VISITS SUBCOLLECTION
                if (user_id && user_id !== 'guest_unknown') {
                    await adminDb.collection('users').doc(user_id).collection('visits').doc(reservationRef.id).set({
                        reservationId: reservationRef.id,
                        eventId: event_id,
                        eventName: eventTitle,
                        date: eventData.date || 'N/A',
                        amount: amount,
                        seats: seatList,
                        createdAt: new Date(),
                        paymentId: id
                    });
                }

                // ==========================
                // 6. SEND TICKET EMAIL
                // ==========================
                
                // Construct the readable seat strings from MP items
                let emailSeats: string[] = [];
                if (paymentData.additional_info?.items) {
                    const ticketItems = paymentData.additional_info.items.filter((item: any) => item.title && !item.title.toLowerCase().includes('servicio'));
                    
                    const summaryMap = new Map<string, number>();
                    ticketItems.forEach((item: any) => {
                        const title = String(item.title).toUpperCase();
                        const qty = Number(item.quantity) || 1;
                        summaryMap.set(title, (summaryMap.get(title) || 0) + qty);
                    });

                    summaryMap.forEach((qty, title) => {
                        emailSeats.push(`${title} (${qty} LUGAR${qty > 1 ? 'ES' : ''})`);
                    });
                }
                
                // Fallback if no items found in MP payload
                if (emailSeats.length === 0) {
                    emailSeats = seatList.length > 0 ? seatList : ['ENTRADA GENERAL (1 LUGAR)'];
                }

                if (contactEmail) {
                    console.log(`[Webhook] Sending ticket email to: ${contactEmail}`);
                    try {
                        await sendTicketEmail(contactEmail, {
                            id: reservationRef.id,
                            eventName: eventTitle,
                            date: eventData.date || new Date().toISOString().split('T')[0],
                            time: eventData.time || '22:00',
                            seats: emailSeats
                        });
                        console.log(`[Webhook] Ticket email sent successfully to ${contactEmail}`);
                    } catch (emailError) {
                        console.error("[Webhook] Error sending ticket email:", emailError);
                    }
                } else {
                    console.log("[Webhook] WARNING: No contactEmail found, skipping ticket email.");
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error("[Webhook] Fatal Error:", error);
        return NextResponse.json({ status: 'error', details: error }, { status: 500 });
    }
}
