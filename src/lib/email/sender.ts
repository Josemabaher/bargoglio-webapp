import { Resend } from 'resend';
import QRCode from 'qrcode';
import { formatDate } from '../utils/format';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReservationDetails {
    id: string;
    eventName: string;
    date: string; // ISO date string e.g. "2026-02-15"
    time: string; // e.g. "22:00"
    seats: string[];
    userEmail?: string;
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarUrl(details: ReservationDetails): string {
    const startDate = new Date(`${details.date}T${details.time || '22:00'}:00`);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${details.eventName} - Bargoglio Club`,
        dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        details: `Tu reserva está confirmada.\nAsientos: ${details.seats.join(', ')}\nID: ${details.id}`,
        location: 'Bargoglio Club, Buenos Aires',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Apple Calendar (.ics) data URL
 */
function generateAppleCalendarUrl(details: ReservationDetails): string {
    const startDate = new Date(`${details.date}T${details.time || '22:00'}:00`);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bargoglio Club//Reservations//ES
BEGIN:VEVENT
UID:${details.id}@bargoglio.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${details.eventName} - Bargoglio Club
DESCRIPTION:Tu reserva está confirmada. Asientos: ${details.seats.join(', ')}. ID: ${details.id}
LOCATION:Bargoglio Club, Buenos Aires
END:VEVENT
END:VCALENDAR`;

    // Encode as data URL for download
    const base64 = Buffer.from(icsContent).toString('base64');
    return `data:text/calendar;base64,${base64}`;
}

export async function sendTicketEmail(to: string, reservationDetails: ReservationDetails) {
    // 1. Generate QR
    const qrDataURL = await QRCode.toDataURL(reservationDetails.id);

    // 2. Generate Calendar URLs
    const googleCalendarUrl = generateGoogleCalendarUrl(reservationDetails);
    const appleCalendarUrl = generateAppleCalendarUrl(reservationDetails);

    // 3. Send Email with improved design
    try {
        await resend.emails.send({
            from: 'Bargoglio <tickets@bargoglio.com>', // Needs verified domain
            to: [to],
            subject: `Tus entradas para ${reservationDetails.eventName} en Bargoglio`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Georgia, serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%); border: 1px solid #d4af37;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #d4af37;">
            <h1 style="color: #d4af37; font-size: 32px; margin: 0; letter-spacing: 4px;">BARGOGLIO</h1>
            <p style="color: #888; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 2px;">Club de Jazz</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">Confirmación de Reserva</h2>
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                ¡Tu reserva está confirmada! Te esperamos para disfrutar de una noche inolvidable.
            </p>
            
            <!-- Event Details Box -->
            <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid #d4af37; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <div style="margin-bottom: 20px;">
                    <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Evento</span>
                    <p style="color: #fff; font-size: 20px; margin: 5px 0 0 0; font-weight: bold;">${reservationDetails.eventName}</p>
                </div>
                <div style="display: flex; gap: 30px;">
                    <div>
                        <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Fecha</span>
                        <p style="color: #d4af37; font-size: 16px; margin: 5px 0 0 0;">${formatDate(reservationDetails.date)}</p>
                    </div>
                    <div>
                        <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Hora</span>
                        <p style="color: #d4af37; font-size: 16px; margin: 5px 0 0 0;">${reservationDetails.time || '22:00'} hs</p>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Ubicaciones</span>
                    <p style="color: #fff; font-size: 16px; margin: 5px 0 0 0;">${reservationDetails.seats.join(', ')}</p>
                </div>
            </div>
            
            <!-- QR Code -->
            <div style="text-align: center; margin: 40px 0; padding: 30px; background: #fff; border-radius: 8px;">
                <img src="${qrDataURL}" alt="QR Ticket" style="width: 180px; height: 180px;" />
                <p style="color: #333; font-size: 12px; margin-top: 15px;">
                    <strong>ID de Reserva:</strong> ${reservationDetails.id}
                </p>
                <p style="color: #666; font-size: 11px; margin-top: 5px;">
                    Presenta este código en la entrada
                </p>
            </div>
            
            <!-- Calendar Buttons -->
            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #888; font-size: 12px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                    Agregar al calendario
                </p>
                <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #4285f4; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 5px;">
                    📅 Google Calendar
                </a>
                <a href="${appleCalendarUrl}" download="bargoglio-reserva.ics" style="display: inline-block; padding: 12px 24px; background: #333; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 5px; border: 1px solid #555;">
                    🍎 Apple Calendar
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px; border-top: 1px solid #333; background: #111;">
            <p style="color: #666; font-size: 12px; margin: 0;">
                Bargoglio Club | Buenos Aires, Argentina
            </p>
            <p style="color: #444; font-size: 10px; margin-top: 10px;">
                Este email fue generado automáticamente. Si tienes dudas, contáctanos por WhatsApp.
            </p>
        </div>
    </div>
</body>
</html>
            `
        });
        console.log("[Email] Ticket sent successfully to:", to);
        return true;
    } catch (error) {
        console.error("[Email] Error sending ticket:", error);
        return false;
    }
}

export async function sendWelcomeEmail(to: string, name: string, resetLink: string) {
    try {
        await resend.emails.send({
            from: 'Bargoglio <welcome@bargoglio.com>',
            to: [to],
            subject: `Bienvenido a Bargoglio - Crea tu contraseña`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Georgia, serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border: 1px solid #d4af37;">
        <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #d4af37;">
            <h1 style="color: #d4af37; font-size: 32px; margin: 0; letter-spacing: 4px;">BARGOGLIO</h1>
        </div>
        <div style="padding: 40px 30px; color: #ccc;">
            <h2 style="color: #fff; margin-bottom: 20px;">¡Hola ${name}!</h2>
            <p>Gracias por tu compra. Hemos creado una cuenta para ti para que puedas gestionar tus puntos y reservas.</p>
            <p>Por favor, haz clic en el siguiente botón para crear tu contraseña:</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 15px 30px; background: #d4af37; color: #000; text-decoration: none; font-weight: bold; border-radius: 4px;">CREAR CONTRASEÑA</a>
            </div>
            <p style="font-size: 12px; color: #666;">Si el botón no funciona, copia y pega este enlace: ${resetLink}</p>
        </div>
    </div>
</body>
</html>
            `
        });
        console.log("[Email] Welcome email sent to:", to);
    } catch (error) {
        console.error("[Email] Error sending welcome email:", error);
    }
}
