import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error logging in with Google", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error logging out", error);
        throw error;
    }
};

// Re-export other auth functions as needed or wrap them
export {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
};
export type { User };
