import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

interface GeneralSettings {
    serviceFeePercentage: number;
}

export function useSettings() {
    const [settings, setSettings] = useState<GeneralSettings>({ serviceFeePercentage: 0.08 }); // Default 8%
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'general');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setSettings(docSnap.data() as GeneralSettings);
                } else {
                    // Create default if not exists
                    await setDoc(docRef, { serviceFeePercentage: 0.08 });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateServiceFee = async (newPercentage: number) => {
        try {
            const docRef = doc(db, 'settings', 'general');
            await setDoc(docRef, { serviceFeePercentage: newPercentage }, { merge: true });
            setSettings(prev => ({ ...prev, serviceFeePercentage: newPercentage }));
            return true;
        } catch (error) {
            console.error("Error updating settings:", error);
            return false;
        }
    };

    return { settings, loading, updateServiceFee };
}
