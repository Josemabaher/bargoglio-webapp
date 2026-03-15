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
    // 1. Generate Calendar URL
    const googleCalendarUrl = generateGoogleCalendarUrl(reservationDetails);

    // 2. Send Email
    try {
        const info = await transporter.sendMail({
            from: `"Bargoglio Club" <${process.env.SMTP_USER}>`, 
            to: to,
            replyTo: "no-reply@bargoglio.com.ar",
            subject: `Reserva confirmada: ${reservationDetails.eventName}`, 
            html: `
<p>Hola,</p>
<p>Tu reserva en Bargoglio Club está confirmada. Te esperamos.</p>

<p><strong>DETALLES DEL EVENTO</strong><br>
Evento: ${reservationDetails.eventName}<br>
Fecha: ${formatDate(reservationDetails.date)}<br>
Hora: ${reservationDetails.time || '22:00'} hs<br>
Ubicaciones: ${reservationDetails.seats.join(', ')}</p>

<p><strong>ID DE RESERVA: ${reservationDetails.id}</strong></p>

<p>Por favor, anunciate en la puerta con tu nombre, DNI o este número de reserva.</p>

${reservationDetails.activationLink ? `
<p>--<br>
<strong>¡Bienvenido al Club!</strong><br>
Creamos una cuenta para vos. Activá tu perfil haciendo clic en el enlace de abajo para sumar 500 puntos para tu próxima consumición:<br>
<a href="${reservationDetails.activationLink}">${reservationDetails.activationLink}</a>
</p>
` : ''}

<p>--<br>
Bargoglio Club<br>
Buenos Aires, Argentina</p>
            `,
            text: `Hola,\n\nTu reserva en Bargoglio Club está confirmada. Te esperamos.\n\nDETALLES DEL EVENTO\nEvento: ${reservationDetails.eventName}\nFecha: ${formatDate(reservationDetails.date)}\nHora: ${reservationDetails.time || '22:00'} hs\nUbicaciones: ${reservationDetails.seats.join(', ')}\n\nID DE RESERVA: ${reservationDetails.id}\n\nPor favor, anunciate en la puerta con tu nombre, DNI o este número de reserva.\n\n${reservationDetails.activationLink ? '--\n¡Bienvenido al Club!\nCreamos una cuenta para vos. Activá tu perfil haciendo clic en el siguiente enlace para sumar 500 puntos:\n' + reservationDetails.activationLink + '\n\n' : ''}--\nBargoglio Club\nBuenos Aires, Argentina`
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
