import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

export interface ReservationDetails {
    id: string;
    eventName: string;
    date: string;
    time: string;
    seats: string[];
    isNewUser?: boolean;
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

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\\d{3}/g, '').slice(0, 15) + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${details.eventName} - Bargoglio Club`,
        dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        details: `Tu reserva está confirmada.\nAsientos: ${details.seats.join(', ')}\nID: ${details.id}`,
        location: 'Bargoglio Club, Buenos Aires',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
    const appUrl = process.env.NEXT_PUBLIC_URL || 'https://bargoglio-webapp.vercel.app';

    // Build activation block for new users (clean short link, no Firebase params)
    const activationBlock = reservationDetails.isNewUser
        ? `\n\n========================================\n¡Hola! Hemos creado una cuenta para vos para que gestiones tus próximas reservas y sumes puntos.\nActivá tu cuenta ahora y acumulá 500 puntos Bargoglio para tu próxima consumición en la barra.\n\nHacé clic aquí para elegir tu contraseña y activar tu perfil:\n${appUrl}/activar-cuenta\n========================================`
        : '';

    // Send Email
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER, 
            to: to,
            replyTo: process.env.SMTP_USER,
            subject: `Reserva confirmada: ${reservationDetails.eventName}`, 
            text: `Hola,\n\nTu reserva en Bargoglio Club está confirmada. Te esperamos.\n\nDETALLES DEL EVENTO\nEvento: ${reservationDetails.eventName}\nFecha: ${formatDate(reservationDetails.date)}\nHora: ${reservationDetails.time || '22:00'} hs\nUbicaciones: ${reservationDetails.seats.join(', ')}\n\nID DE RESERVA: ${reservationDetails.id}\n\nPor favor, anunciate en la puerta con tu nombre, DNI o este número de reserva.${activationBlock}\n\n--\nBargoglio Club\nBuenos Aires, Argentina`
        });

        console.log("[Email] Ticket sent successfully to:", to, "Message ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("[Email] Error sending ticket:", error);
        return false;
    }
}
