import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
// If no key is provided, it will throw an error when trying to send
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Valid placeholder to prevent crash during init, but will fail verify

interface OrderFullDetails {
    id: string;
    customerName: string;
    email: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    // Add other fields as needed
}

export async function sendTicketEmail(to: string, pdfBuffer: Buffer, order: OrderFullDetails) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending simulated.');
        return { id: 'simulated-email-id' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Bargoglio <tickets@bargoglio.com.ar>', // You should verify this domain in Resend dashboard or use onboarding@resend.dev for testing
            to: [to],
            // For testing purposes, if domain is not verified, you can only send to the email you signed up with on Resend.
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

        if (error) {
            console.error('Resend Error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        console.log('Email sent successfully:', data);
        return data;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
}
