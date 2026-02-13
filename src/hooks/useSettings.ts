import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

interface GeneralSettings {
    serviceFeePercentage: number;
    pesosPerPoint: number;
}

export function useSettings() {
    // Default: 8% service fee, $1000 per point
    const [settings, setSettings] = useState<GeneralSettings>({
        serviceFeePercentage: 0.08,
        pesosPerPoint: 1000
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'general');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSettings({
                        serviceFeePercentage: data.serviceFeePercentage ?? 0.08,
                        pesosPerPoint: data.pesosPerPoint ?? 1000
                    });
                } else {
                    // Create default if not exists
                    await setDoc(docRef, { serviceFeePercentage: 0.08, pesosPerPoint: 1000 });
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

    const updatePointsRatio = async (newRatio: number) => {
        try {
            const docRef = doc(db, 'settings', 'general');
            await setDoc(docRef, { pesosPerPoint: newRatio }, { merge: true });
            setSettings(prev => ({ ...prev, pesosPerPoint: newRatio }));
            return true;
        } catch (error) {
            console.error("Error updating points ratio:", error);
            return false;
        }
    };

    return { settings, loading, updateServiceFee, updatePointsRatio };
}
