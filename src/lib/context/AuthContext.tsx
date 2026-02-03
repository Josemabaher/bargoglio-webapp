"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile } from '../../types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Subscribe to user profile changes in Firestore
                const userRef = doc(db, "users", firebaseUser.uid);
                const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
                    } else {
                        setUserProfile(null);
                    }
                    setLoading(false);
                });

                return () => unsubscribeProfile();
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
