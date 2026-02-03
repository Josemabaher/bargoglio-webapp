import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import { db } from "./config";

// We will add specific helpers for Events and Reservations here later.
// For now, exporting common Firestore functions for use in other parts of the app.

export {
    db,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp
};
