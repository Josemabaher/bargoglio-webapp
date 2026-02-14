import { Timestamp } from 'firebase/firestore';

export interface Seat {
    id: string; // concise logical ID like "A1", "T1-S1"
    tableId?: string; // Optional reference to a table group
    tableNumber?: number; // Human-readable table number (1-37) for display on tickets
    status: 'available' | 'reserved' | 'occupied' | 'blocked';
    x: number; // coordinate for map placement
    y: number; // coordinate for map placement
    label?: string; // Display label (Zona 1, Zona 2, etc.)
    price?: number; // Price for this specific seat
}

export interface ZonePrice {
    zoneName: string;
    price: number;
    color?: string; // Hex color for mapping
}

export type NivelCliente = 'Bronce' | 'Plata' | 'Oro';

export interface Event {
    id?: string;
    title: string;
    description: string;
    flyerUrl: string;
    flyer_url?: string; // Alias for compatibility
    date: string; // ISO date string
    time: string;
    zonesPrices: ZonePrice[];
    precios_por_zona: number[]; // [zona1, zona2, zona3] prices
    seats?: Seat[]; // Array of all seats for this event (snapshot or reference)
    isActive: boolean;
    menuPdfUrl?: string; // URL to menu PDF in Cloudinary
    category?: 'show' | 'cultural'; // Default to 'show' if missing
    pricingType?: 'zones' | 'general' | 'free'; // Pricing model
    generalPrice?: number; // Used when pricingType is 'general'
}

export interface Reservation {
    id?: string;
    userId: string;
    userEmail?: string; // Optional for quick reference
    eventId: string;
    seatIds: string[]; // IDs of seats selected
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    timestamp: Timestamp;
    paymentId?: string; // Reference to payment
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phone?: string;
    birthDate?: string; // Format: "MM-DD" for birthday matching (legacy)
    points?: number; // Loyalty points (1 point per $1000)
    role: 'admin' | 'user';
    createdAt: Timestamp;
    // Extended fields for Admin Dashboard
    nombre: string;
    apellido: string;
    telefono: string;
    fecha_nacimiento: Timestamp; // Full birthday for filtering
    nivel_cliente: NivelCliente; // Bronce / Plata / Oro
    ultima_visita: Timestamp;
    notas_internas?: string; // Internal staff notes
    direccion?: string; // New field
    provincia?: string; // New field
    dni?: string; // New field
    totalSpent?: number; // Aggregated total spent
    visitCount?: number; // Aggregated visit count
}

export interface GuestUser {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    dni: string;
    fecha_nacimiento: string; // ISO string for form
    direccion: string;
    provincia: string;
}

export interface ReservationDetails {
    id: string;
    eventName: string;
    date: string; // ISO date string e.g. "2026-02-15"
    time: string; // e.g. "22:00"
    seats: string[];
    userEmail?: string;
}
