/**
 * Points calculation logic for Bargoglio
 * 1 point per $1,000 spent
 */

import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Calculate points earned from a purchase amount
 * @param amount - Purchase amount in ARS
 * @returns Number of points earned (1 per $1000)
 */
export function calculatePoints(amount: number): number {
    if (amount < 0) return 0;
    return Math.floor(amount / 1000);
}

/**
 * Add points to a user's balance after a confirmed payment
 * @param userId - User's UID
 * @param amount - Purchase amount in ARS (points will be calculated)
 */
export async function addPointsToUser(userId: string, amount: number): Promise<void> {
    const points = calculatePoints(amount);
    if (points <= 0) return;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        points: increment(points)
    });
}

/**
 * Update user's client level based on total points
 * Bronce: 0-499 pts, Plata: 500-1499 pts, Oro: 1500+ pts
 */
export function determineClientLevel(totalPoints: number): 'Bronce' | 'Plata' | 'Oro' {
    if (totalPoints >= 1500) return 'Oro';
    if (totalPoints >= 500) return 'Plata';
    return 'Bronce';
}
