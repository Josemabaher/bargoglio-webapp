import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            };

        if (serviceAccount.projectId) {
            console.log("Firebase Admin: Initializing with service account...", serviceAccount.projectId);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin: Initialization successful.");
        } else {
            console.warn("Firebase Admin: Missing service account variables. Attempting default init.");
            admin.initializeApp();
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
} else {
    console.log("Firebase Admin: Already initialized.");
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
