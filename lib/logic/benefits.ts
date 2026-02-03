/**
 * Logic to determine if a user gets birthday benefits.
 * Benefit: Free entry + Champagne if birthday is within +/- 7 days of event date? 
 * Or just separate logic for "Birthday List".
 * 
 * For now, simple logic: if Month and Day match today (or event date).
 */

interface UserProfile {
    id: string;
    birthDate: Date | string; // Handle both Date object or ISO string
    // ... other fields
}

export function isBirthday(birthDate: Date | string, targetDate: Date = new Date()): boolean {
    const bDate = new Date(birthDate);
    const tDate = new Date(targetDate);

    return bDate.getDate() === tDate.getDate() &&
        bDate.getMonth() === tDate.getMonth();
}

export function getBirthdayBenefits(user: UserProfile, eventDate: Date): { eligible: boolean, benefits: string[] } {
    if (!user.birthDate) {
        return { eligible: false, benefits: [] };
    }

    const isBday = isBirthday(user.birthDate, eventDate);

    if (isBday) {
        return {
            eligible: true,
            benefits: ['Free Entry', 'Complimentary Champagne Bottle']
        };
    }

    return { eligible: false, benefits: [] };
}
