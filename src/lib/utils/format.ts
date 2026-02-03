/**
 * Formats a date string (YYYY-MM-DD or ISO) to DD/MM/YYYY format.
 */
export const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '';

    // If it's YYYY-MM-DD
    if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }

    return dateStr;
};

/**
 * Formats a time string to 24-hour format (HH:mm).
 */
export const formatTime = (timeStr: string | undefined | null): string => {
    if (!timeStr) return '';

    // Remove " hs" or " PM/AM" if present for internal processing
    let cleanTime = timeStr.toLowerCase().replace(' hs', '').trim();

    // Handle AM/PM if mistakenly entered
    if (cleanTime.includes('am') || cleanTime.includes('pm')) {
        try {
            const [time, modifier] = cleanTime.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'pm') hours = (parseInt(hours, 10) + 12).toString();
            cleanTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        } catch (e) {
            return timeStr;
        }
    }

    // Ensure HH:mm format
    if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    return cleanTime;
};
