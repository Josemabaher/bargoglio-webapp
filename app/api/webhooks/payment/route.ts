import { NextRequest, NextResponse } from 'next/server';
import { sendTicketEmail } from '@/lib/services/email';
import { generateTicketPDF } from '@/lib/services/pdf';

// Mock DB function
// In a real app, you'd fetch this from Firebase
async function getOrderDetails(orderId: string) {
    return {
        id: orderId,
        customerName: 'Juan Perez', // Should come from DB
        email: 'juan@example.com', // Should come from DB
        date: new Date().toLocaleDateString(),
        items: [{ name: 'General Admission', quantity: 2, price: 1500 }],
        total: 3000
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate webhook signature (important for security in production)
        // const signature = req.headers.get('x-signature');

        const { type, data } = body;

        // Example condition: Payment Approved
        if (type === 'payment' && data.status === 'approved') {
            const orderId = data.id;
            console.log(`Processing approved payment for order: ${orderId}`);

            const order = await getOrderDetails(orderId);

            // 1. Generate PDF
            const pdfBuffer = await generateTicketPDF(order);

            // 2. Send Email
            await sendTicketEmail(order.email, pdfBuffer, order);

            return NextResponse.json({ success: true, message: 'Ticket sent' });
        }

        return NextResponse.json({ success: true, message: 'Webhook received' });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
