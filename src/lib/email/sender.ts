import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

export interface ReservationDetails {
    id: string;
    eventName: string;
    date: string;
    time: string;
    seats: string[];
    activationLink?: string;
}

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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

const formatDate = (dateString: string) => {
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};


export async function sendTicketEmail(to: string, reservationDetails: ReservationDetails) {
    // 1. Generate QR
    const qrDataURL = await QRCode.toDataURL(reservationDetails.id, {
        width: 150,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
    });

    // 2. Generate Calendar URL
    const googleCalendarUrl = generateGoogleCalendarUrl(reservationDetails);
    const appUrl = process.env.NEXT_PUBLIC_URL || 'https://bargoglio-webapp.vercel.app';

    // 3. Send Email
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER, 
            to: to,
            replyTo: process.env.SMTP_USER,
            subject: `Entradas: ${reservationDetails.eventName} - Bargoglio`, 
            html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu Reserva en Bargoglio</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #d4af37;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #333;">
            <img src="${appUrl}/Bargoglio-Logo-Circulo-Transparente-02.png" alt="Bargoglio" style="width: 80px; height: 80px; margin-bottom: 15px;" />
            <h1 style="color: #d4af37; font-size: 24px; margin: 0; letter-spacing: 2px;">BARGOGLIO</h1>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 30px;">
            <h2 style="color: #fff; font-size: 20px; margin-top: 0; text-transform: uppercase;">Reserva Confirmada</h2>
            <p style="color: #eee; font-size: 15px; margin-bottom: 25px;">
                Asistí al evento anunciándote con tu DNI o mostrando el código QR en la puerta.
            </p>
            
            <!-- Event Details -->
            <div style="background-color: #222; border: 1px solid #444; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0 0 10px 0;">
                    <span style="color: #888; font-size: 11px; display: block; text-transform: uppercase;">Evento</span>
                    <strong style="color: #fff; font-size: 16px;">${reservationDetails.eventName}</strong>
                </p>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                    <tr>
                        <td width="50%">
                            <span style="color: #888; font-size: 11px; display: block; text-transform: uppercase;">Fecha</span>
                            <strong style="color: #d4af37; font-size: 14px;">${formatDate(reservationDetails.date)}</strong>
                        </td>
                        <td width="50%">
                            <span style="color: #888; font-size: 11px; display: block; text-transform: uppercase;">Hora</span>
                            <strong style="color: #d4af37; font-size: 14px;">${reservationDetails.time || '22:00'} hs</strong>
                        </td>
                    </tr>
                </table>
                <div>
                    <span style="color: #888; font-size: 11px; display: block; text-transform: uppercase;">Ubicaciones</span>
                    <strong style="color: #fff; font-size: 14px; line-height: 1.4;">${reservationDetails.seats.join('<br>')}</strong>
                </div>
            </div>

            <!-- Activation Box -->
            ${reservationDetails.activationLink ? `
            <div style="background-color: #A11A16; padding: 25px; margin-bottom: 25px; border-radius: 4px; border: 1px solid #d4af37; text-align: center;">
                <h3 style="color: #fff; font-size: 16px; margin: 0 0 10px 0; text-transform: uppercase;">¡Bienvenido al Club!</h3>
                <p style="color: #fff; font-size: 14px; margin-bottom: 20px;">
                    Creamos una cuenta por vos. Activá tu perfil y sumá <strong><span style="color: #d4af37;">500 puntos</span></strong> para canjear en la barra.
                </p>
                <a href="${reservationDetails.activationLink}" style="background-color: #d4af37; color: #000; padding: 12px 20px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 4px; display: inline-block;">ACTIVAR CUENTA</a>
            </div>
            ` : ''}
            
            <!-- QR Section -->
            <div style="text-align: center; padding: 20px; background: #fff; border-radius: 4px;">
                <img src="${qrDataURL}" alt="Ticket QR" style="width: 150px; height: 150px;" />
                <p style="color: #333; font-size: 12px; margin: 10px 0 0 0; font-family: monospace;">ID: ${reservationDetails.id}</p>
            </div>
            
            <!-- Calendar Section -->
            <div style="text-align: center; margin-top: 25px;">
                <a href="${googleCalendarUrl}" target="_blank" style="color: #4285f4; text-decoration: none; font-size: 13px; font-weight: bold;">+ Agregar a Google Calendar</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; border-top: 1px solid #333; background-color: #111;">
            <p style="color: #666; font-size: 11px; margin: 0;">Bargoglio Club | Buenos Aires, Argentina</p>
        </div>
    </div>
</body>
</html>
            `,
            text: `Reserva Confirmada - ${reservationDetails.eventName} - ${formatDate(reservationDetails.date)} a las ${reservationDetails.time || '22:00'} hs. ID de reserva: ${reservationDetails.id}. ${reservationDetails.activationLink ? 'Activa tu cuenta aquí: ' + reservationDetails.activationLink : ''}`
        });

        console.log("[Email] Ticket sent successfully to:", to, "Message ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("[Email] Error sending ticket:", error);
        return false;
    }
}

export async function sendWelcomeEmail(to: string, name: string, resetLink: string) {
    try {
        const info = await transporter.sendMail({
            from: `"Bargoglio Club" <${process.env.SMTP_USER}>`,
            to: to,
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
        console.log("[Email] Welcome email sent to:", to, "Message ID:", info.messageId);
    } catch (error) {
        console.error("[Email] Error sending welcome email:", error);
    }
}
