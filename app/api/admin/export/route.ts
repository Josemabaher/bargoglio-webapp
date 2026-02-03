import { NextRequest, NextResponse } from 'next/server';
import { generateAttendeeExcel, generateAttendeePDF } from '@/lib/services/admin';

// Mock Data Source
const mockAttendees = [
    { id: '1', name: 'Ana Gomez', email: 'ana@test.com', ticketType: 'General', price: 1500, checkInStatus: 'Pending' as const },
    { id: '2', name: 'Carlos Diaz', email: 'carlos@test.com', ticketType: 'VIP', price: 3000, checkInStatus: 'Checked In' as const },
];

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format'); // 'excel' or 'pdf'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    try {
        if (format === 'excel') {
            const buffer = generateAttendeeExcel(mockAttendees);

            return new NextResponse(buffer as any, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="attendees-${date}.xlsx"`,
                },
            });
        } else if (format === 'pdf') {
            const buffer = await generateAttendeePDF(mockAttendees, date);

            return new NextResponse(buffer as any, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="attendees-${date}.pdf"`,
                },
            });
        }

        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

    } catch (error: any) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
