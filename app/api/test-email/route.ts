import { NextResponse } from 'next/server';
import { sendTicketEmail } from '@/src/lib/email/sender';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    try {
        const testDetails = {
            id: 'TEST-RESERVATION-123',
            eventName: 'Show de Prueba SMTP',
            date: '2026-02-14',
            time: '22:00',
            seats: ['Mesa 1', 'Mesa 2'],
            userEmail: email
        };

        const result = await sendTicketEmail(email, testDetails);

        if (result) {
            return NextResponse.json({ success: true, message: `Email de prueba enviado a ${email}` });
        } else {
            return NextResponse.json({ success: false, error: 'Falló el envío del correo. Revisa la consola del servidor.' }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
