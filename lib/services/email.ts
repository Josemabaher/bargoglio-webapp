import nodemailer from 'nodemailer';

// Initialize Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface OrderFullDetails {
    id: string;
    customerName: string;
    email: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    // Add other fields as needed
}

export async function sendTicketEmail(to: string, pdfBuffer: Buffer, order: OrderFullDetails) {
    // Basic check for configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('SMTP_HOST or SMTP_USER is not set. Email sending simulated.');
        return { id: 'simulated-email-id' };
    }

    try {
        const info = await transporter.sendMail({
            from: `"Bargoglio" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Your Ticket for Bargoglio (Order #${order.id})`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Hello ${order.customerName},</h1>
                    <p>Thank you for your purchase!</p>
                    <p>Attached you will find your entrance ticket with the QR code.</p>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #666; font-size: 12px;">Bargoglio Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Bargoglio-Ticket-${order.id}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
}
