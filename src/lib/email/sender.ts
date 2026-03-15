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
            from: process.env.SMTP_USER, 
            to: to,
            replyTo: process.env.SMTP_USER,
            subject: `Reserva confirmada: ${reservationDetails.eventName}`, 
            text: `Hola,\n\nTu reserva en Bargoglio Club está confirmada. Te esperamos.\n\nDETALLES DEL EVENTO\nEvento: ${reservationDetails.eventName}\nFecha: ${formatDate(reservationDetails.date)}\nHora: ${reservationDetails.time || '22:00'} hs\nUbicaciones: ${reservationDetails.seats.join(', ')}\n\nID DE RESERVA: ${reservationDetails.id}\n\nPor favor, anunciate en la puerta con tu nombre, DNI o este número de reserva.\n\n${reservationDetails.activationLink ? '--\n¡Bienvenido al Club!\nCreamos una cuenta para vos. Activá tu perfil haciendo clic en el siguiente enlace para sumar 500 puntos (o copiándolo en el navegador):\n' + reservationDetails.activationLink + '\n\n' : ''}--\nBargoglio Club\nBuenos Aires, Argentina`
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
            replyTo: "no-reply@bargoglio.com.ar",
            subject: `Bienvenido a Bargoglio - Tu cuenta`,
            text: `¡Hola ${name}!\n\nGracias por tu compra. Hemos creado una cuenta para vos para que puedas gestionar tus puntos y reservas.\n\nPor favor, copiá y pegá el siguiente enlace en tu navegador para crear tu contraseña segura:\n${resetLink}\n\n--\nBargoglio Club\nBuenos Aires, Argentina`
        });
        console.log("[Email] Welcome email sent to:", to, "Message ID:", info.messageId);
    } catch (error) {
        console.error("[Email] Error sending welcome email:", error);
    }
}
