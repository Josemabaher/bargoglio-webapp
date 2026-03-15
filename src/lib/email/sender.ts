import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

export interface ReservationDetails {
    id: string;
    eventName: string;
    date: string;
    time: string;
    seats: string[];
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

const formatDate = (dateString: string) => {
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};

export async function sendTicketEmail(to: string, reservationDetails: ReservationDetails) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER, 
            to: to,
            replyTo: process.env.SMTP_USER,
            subject: `Reserva confirmada: ${reservationDetails.eventName}`, 
            text: `Hola,\n\nTu reserva en Bargoglio Club esta confirmada. Te esperamos.\n\nDETALLES DEL EVENTO\nEvento: ${reservationDetails.eventName}\nFecha: ${formatDate(reservationDetails.date)}\nHora: ${reservationDetails.time || '22:00'} hs\nUbicaciones: ${reservationDetails.seats.join(', ')}\n\nID DE RESERVA: ${reservationDetails.id}\n\nPor favor, anunciate en la puerta con tu nombre, DNI o este numero de reserva.\n\n--\nBargoglio Club\nBuenos Aires, Argentina`
        });

        console.log("[Email] Ticket sent successfully to:", to, "Message ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("[Email] Error sending ticket:", error);
        return false;
    }
}
