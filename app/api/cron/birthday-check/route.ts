import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import { sendBirthdayEmail } from '@/src/lib/email/birthday';

/**
 * Birthday Check Cron Endpoint
 * 
 * This endpoint should be called daily (e.g., via Vercel Cron or external service)
 * It checks for users whose birthday matches today's date (MM-DD format)
 * and sends them a birthday greeting email.
 * 
 * Usage: GET /api/cron/birthday-check
 * Optional: Add a secret token for security in production
 */
export async function GET(req: Request) {
    try {
        // Get today's date in MM-DD format
        const today = new Date();
        const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        console.log(`[Birthday Cron] Checking for birthdays on ${monthDay}`);

        // Query users with matching birthDate
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('birthDate', '==', monthDay));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("[Birthday Cron] No birthdays today");
            return NextResponse.json({
                success: true,
                message: "No birthdays today",
                count: 0
            });
        }

        // Send birthday emails
        const results: { email: string; success: boolean }[] = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const email = userData.email;
            const name = userData.displayName || 'Amigo/a';

            if (email) {
                const success = await sendBirthdayEmail({
                    to: email,
                    userName: name
                });
                results.push({ email, success });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`[Birthday Cron] Sent ${successCount}/${results.length} birthday emails`);

        return NextResponse.json({
            success: true,
            message: `Processed ${results.length} birthdays`,
            sent: successCount,
            results
        });

    } catch (error) {
        console.error("[Birthday Cron] Error:", error);
        return NextResponse.json({
            success: false,
            error: "Internal server error"
        }, { status: 500 });
    }
}
