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
    const qrDataURL = await QRCode.toDataURL(reservationDetails.id);

    // 2. Generate Calendar URLs
    const googleCalendarUrl = generateGoogleCalendarUrl(reservationDetails);
    const appleCalendarUrl = generateAppleCalendarUrl(reservationDetails);

    const appUrl = process.env.NEXT_PUBLIC_URL || 'https://bargoglio-webapp.vercel.app';

    // 3. Send Email with improved design
    try {
        const info = await transporter.sendMail({
            from: `"Bargoglio Club" <${process.env.SMTP_USER}>`, // sender address
            to: to, // list of receivers
            subject: `Tu compra fue un éxito`, // Subject line
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-left: 1px solid #d4af37; border-right: 1px solid #d4af37;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #333; border-top: 1px solid #d4af37;">
            <img src="${appUrl}/Bargoglio-Logo-Circulo-Transparente-02.png" alt="Bargoglio Logo" style="width: 90px; height: 90px; margin-bottom: 15px;" />
            <h1 style="color: #d4af37; font-size: 26px; margin: 0; letter-spacing: 4px; font-family: Georgia, serif;">BARGOGLIO</h1>
            <p style="color: #888; font-size: 11px; margin-top: 10px; font-weight: bold; letter-spacing: 0.5px;">Plataforma Cultural | Música - Libros - Gastronomía</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #fff; font-size: 22px; margin: 0 0 15px 0; text-transform: uppercase; font-family: inherit;">RESERVA CONFIRMADA</h2>
            
            <p style="color: #fff; font-size: 15px; margin-bottom: 30px; font-weight: bold;">
                Ingresás anunciándote con tu nombre en la puerta
            </p>
            
            <!-- Event Details Box -->
            <div style="background-color: transparent; border: 1px solid #5a5639; padding: 25px; margin: 30px 0;">
                <div style="margin-bottom: 20px;">
                    <span style="color: #888; font-size: 11px; text-transform: uppercase;">EVENTO</span>
                    <p style="color: #fff; font-size: 18px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase;">${reservationDetails.eventName}</p>
                </div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                        <td width="50%" valign="top">
                            <span style="color: #888; font-size: 11px; text-transform: uppercase;">FECHA</span>
                            <p style="color: #d4af37; font-size: 15px; margin: 5px 0 0 0;">${formatDate(reservationDetails.date)}</p>
                        </td>
                        <td width="50%" valign="top">
                            <span style="color: #888; font-size: 11px; text-transform: uppercase;">HORA</span>
                            <p style="color: #d4af37; font-size: 15px; margin: 5px 0 0 0;">${reservationDetails.time || '22:00'} hs</p>
                        </td>
                    </tr>
                </table>
                <div>
                    <span style="color: #888; font-size: 11px; text-transform: uppercase;">UBICACIONES</span>
                    <p style="color: #fff; font-size: 14px; margin: 5px 0 0 0; font-weight: bold; line-height: 1.5;">${reservationDetails.seats.join('<br>')}</p>
                </div>
            </div>

            ${reservationDetails.activationLink ? `
            <!-- Welcome Club Box -->
            <div style="background-color: #A11A16; border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #d4af37;">
                <h3 style="color: #fff; font-size: 18px; margin: 0 0 10px 0; text-transform: uppercase;">¡Bienvenido al Club Bargoglio!</h3>
                <p style="color: #fff; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Hemos creado una cuenta para vos para que gestiones tus próximas reservas y sumes puntos. Activá tu cuenta ahora y acumulá <strong><span style="color: #d4af37;">500 puntos Bargoglio</span></strong> para tu próxima consumición en la barra.
                </p>
                <div style="text-align: center; margin-top: 25px; margin-bottom: 10px;">
                    <a href="${reservationDetails.activationLink}" style="background-color: #d4af37; color: #1a1a1a; padding: 12px 25px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 4px; text-transform: uppercase; display: inline-block;">Activar y Setear Contraseña</a>
                </div>
            </div>
            ` : ''}
            
            <!-- QR Code Box -->
            <div style="text-align: center; margin: 40px 0; padding: 30px; background: #fff;">
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
                <p style="color: #888; font-size: 11px; margin-bottom: 15px; text-transform: uppercase; font-weight: bold;">
                    AGREGAR AL CALENDARIO
                </p>
                <div style="display: inline-block; margin-right: 10px;">
                    <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #4285f4; color: #fff; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        Google Calendar
                    </a>
                </div>
                <div style="display: inline-block;">
                    <a href="${appleCalendarUrl}" download="bargoglio-reserva.ics" style="display: inline-block; padding: 10px 20px; background: transparent; border: 1px solid #555; color: #fff; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        🍎 Apple Calendar
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; border-top: 1px solid #222; background-color: #111;">
            <p style="color: #666; font-size: 11px; margin: 0;">
                Bargoglio Club | Buenos Aires, Argentina
            </p>
            <p style="color: #444; font-size: 9px; margin-top: 10px;">
                Este email fue generado automáticamente. Si tienes dudas, contáctanos por WhatsApp.
            </p>
        </div>
    </div>
</body>
</html>
            `,
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
