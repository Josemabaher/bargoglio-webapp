import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/lib/firebase/admin';

export async function GET(req: NextRequest) {
    try {
        const email = `test.guest.${Date.now()}@example.com`;
        const guestInfo = {
            nombre: "Test",
            apellido: "Guest",
            dni: "12345678",
            phone: "1122334455",
            email: email,
            direccion: "Calle Test 123",
            provincia: "CABA",
            fecha_nacimiento: "1990-01-01"
        };

        console.log("Starting Webhook Logic Test...");

        // 1. Create User
        let uid;
        try {
            const newUser = await adminAuth.createUser({
                email: email,
                emailVerified: true,
                displayName: `${guestInfo.nombre} ${guestInfo.apellido}`,
                disabled: false
            });
            uid = newUser.uid;
            console.log("Create User Success:", uid);
        } catch (e: any) {
            console.error("Create User Error:", e);
            return NextResponse.json({ error: "Create User Failed", details: e }, { status: 500 });
        }

        // 2. Set Firestore Data
        try {
            await adminDb.collection('users').doc(uid).set({
                ...guestInfo,
                role: 'user',
                createdAt: new Date(),
                points: 0,
                nivel_cliente: 'Bronce',
                test_run: true
            });
            console.log("Firestore Write Success");
        } catch (e: any) {
            console.error("Firestore Write Error:", e);
            return NextResponse.json({ error: "Firestore Failed", details: e }, { status: 500 });
        }

        // 3. Generate Reset Link (Internal check only, not sending email to avoid spam/quota)
        try {
            const link = await adminAuth.generatePasswordResetLink(email);
            console.log("Reset Link Generated:", link);
        } catch (e: any) {
            console.error("Generate Link Error:", e);
            return NextResponse.json({ error: "Generate Link Failed", details: e }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Test Cycle Complete",
            createdUser: email,
            uid: uid
        });

    } catch (error) {
        return NextResponse.json({ error: "Fatal Test Error", details: error }, { status: 500 });
    }
}
