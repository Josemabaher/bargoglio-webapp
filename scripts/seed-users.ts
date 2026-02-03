/**
 * Seed script for generating 20 fictional users
 * 
 * To run this script:
 * 1. Import seedUsers from this file in an admin page
 * 2. Call seedUsers() function
 * 
 * Requirements:
 * - 20 users with all fields complete
 * - At least 3 users with birthdays between Jan 29 - Feb 5
 * - Distribution: 12 Bronce, 5 Plata, 3 Oro
 */

import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import { NivelCliente } from '@/src/types';

// Helper to create Timestamp from date parts
function createBirthday(month: number, day: number, year: number = 1990): Timestamp {
    return Timestamp.fromDate(new Date(year, month - 1, day));
}

// Helper to create recent date
function recentDate(daysAgo: number): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return Timestamp.fromDate(date);
}

interface SeedUser {
    uid: string;
    email: string;
    nombre: string;
    apellido: string;
    telefono: string;
    fecha_nacimiento: Timestamp;
    puntos: number;
    points: number;
    nivel_cliente: NivelCliente;
    ultima_visita: Timestamp;
    notas_internas: string;
    role: 'user' | 'admin';
    createdAt: Timestamp;
    displayName: string;
    birthDate: string;
}

const SEED_USERS: SeedUser[] = [
    // 3 users with birthdays THIS WEEK (Jan 29 - Feb 5, 2026)
    {
        uid: 'user-001',
        email: 'martin.lopez@email.com',
        nombre: 'Martín',
        apellido: 'López',
        telefono: '+54 11 4567-8901',
        fecha_nacimiento: createBirthday(1, 29, 1988), // Jan 29
        puntos: 1800,
        points: 1800,
        nivel_cliente: 'Oro',
        ultima_visita: recentDate(2),
        notas_internas: 'Cliente VIP, prefiere mesa cerca del escenario',
        role: 'user',
        createdAt: recentDate(180),
        displayName: 'Martín López',
        birthDate: '01-29'
    },
    {
        uid: 'user-002',
        email: 'lucia.fernandez@email.com',
        nombre: 'Lucía',
        apellido: 'Fernández',
        telefono: '+54 11 5678-9012',
        fecha_nacimiento: createBirthday(2, 1, 1995), // Feb 1
        puntos: 650,
        points: 650,
        nivel_cliente: 'Plata',
        ultima_visita: recentDate(7),
        notas_internas: 'Viene con grupo grande los fines de semana',
        role: 'user',
        createdAt: recentDate(120),
        displayName: 'Lucía Fernández',
        birthDate: '02-01'
    },
    {
        uid: 'user-003',
        email: 'santiago.garcia@email.com',
        nombre: 'Santiago',
        apellido: 'García',
        telefono: '+54 11 6789-0123',
        fecha_nacimiento: createBirthday(2, 4, 1992), // Feb 4
        puntos: 320,
        points: 320,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(14),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(60),
        displayName: 'Santiago García',
        birthDate: '02-04'
    },
    // Remaining 17 users with varied birthdays
    {
        uid: 'user-004',
        email: 'camila.rodriguez@email.com',
        nombre: 'Camila',
        apellido: 'Rodríguez',
        telefono: '+54 11 7890-1234',
        fecha_nacimiento: createBirthday(3, 15, 1990),
        puntos: 2100,
        points: 2100,
        nivel_cliente: 'Oro',
        ultima_visita: recentDate(1),
        notas_internas: 'Cliente frecuente, trae amigos nuevos',
        role: 'user',
        createdAt: recentDate(365),
        displayName: 'Camila Rodríguez',
        birthDate: '03-15'
    },
    {
        uid: 'user-005',
        email: 'nicolas.martinez@email.com',
        nombre: 'Nicolás',
        apellido: 'Martínez',
        telefono: '+54 11 8901-2345',
        fecha_nacimiento: createBirthday(5, 22, 1987),
        puntos: 1600,
        points: 1600,
        nivel_cliente: 'Oro',
        ultima_visita: recentDate(3),
        notas_internas: 'Siempre reserva zona 1',
        role: 'user',
        createdAt: recentDate(200),
        displayName: 'Nicolás Martínez',
        birthDate: '05-22'
    },
    {
        uid: 'user-006',
        email: 'valentina.gonzalez@email.com',
        nombre: 'Valentina',
        apellido: 'González',
        telefono: '+54 11 9012-3456',
        fecha_nacimiento: createBirthday(7, 8, 1993),
        puntos: 890,
        points: 890,
        nivel_cliente: 'Plata',
        ultima_visita: recentDate(5),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(150),
        displayName: 'Valentina González',
        birthDate: '07-08'
    },
    {
        uid: 'user-007',
        email: 'facundo.perez@email.com',
        nombre: 'Facundo',
        apellido: 'Pérez',
        telefono: '+54 11 0123-4567',
        fecha_nacimiento: createBirthday(9, 12, 1991),
        puntos: 720,
        points: 720,
        nivel_cliente: 'Plata',
        ultima_visita: recentDate(10),
        notas_internas: 'Prefiere zona tranquila',
        role: 'user',
        createdAt: recentDate(90),
        displayName: 'Facundo Pérez',
        birthDate: '09-12'
    },
    {
        uid: 'user-008',
        email: 'sofia.sanchez@email.com',
        nombre: 'Sofía',
        apellido: 'Sánchez',
        telefono: '+54 11 1234-5678',
        fecha_nacimiento: createBirthday(11, 25, 1994),
        puntos: 580,
        points: 580,
        nivel_cliente: 'Plata',
        ultima_visita: recentDate(15),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(100),
        displayName: 'Sofía Sánchez',
        birthDate: '11-25'
    },
    {
        uid: 'user-009',
        email: 'mateo.romero@email.com',
        nombre: 'Mateo',
        apellido: 'Romero',
        telefono: '+54 11 2345-6789',
        fecha_nacimiento: createBirthday(4, 3, 1989),
        puntos: 520,
        points: 520,
        nivel_cliente: 'Plata',
        ultima_visita: recentDate(20),
        notas_internas: 'Cumpleaños en abril',
        role: 'user',
        createdAt: recentDate(80),
        displayName: 'Mateo Romero',
        birthDate: '04-03'
    },
    {
        uid: 'user-010',
        email: 'julieta.diaz@email.com',
        nombre: 'Julieta',
        apellido: 'Díaz',
        telefono: '+54 11 3456-7890',
        fecha_nacimiento: createBirthday(6, 17, 1996),
        puntos: 410,
        points: 410,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(8),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(45),
        displayName: 'Julieta Díaz',
        birthDate: '06-17'
    },
    {
        uid: 'user-011',
        email: 'tomas.alvarez@email.com',
        nombre: 'Tomás',
        apellido: 'Álvarez',
        telefono: '+54 11 4567-8901',
        fecha_nacimiento: createBirthday(8, 30, 1990),
        puntos: 350,
        points: 350,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(12),
        notas_internas: 'Nuevo cliente',
        role: 'user',
        createdAt: recentDate(30),
        displayName: 'Tomás Álvarez',
        birthDate: '08-30'
    },
    {
        uid: 'user-012',
        email: 'agustina.torres@email.com',
        nombre: 'Agustina',
        apellido: 'Torres',
        telefono: '+54 11 5678-9012',
        fecha_nacimiento: createBirthday(10, 5, 1993),
        puntos: 280,
        points: 280,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(25),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(55),
        displayName: 'Agustina Torres',
        birthDate: '10-05'
    },
    {
        uid: 'user-013',
        email: 'benjamin.ruiz@email.com',
        nombre: 'Benjamín',
        apellido: 'Ruiz',
        telefono: '+54 11 6789-0123',
        fecha_nacimiento: createBirthday(12, 20, 1988),
        puntos: 220,
        points: 220,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(18),
        notas_internas: 'Viene solo los sábados',
        role: 'user',
        createdAt: recentDate(40),
        displayName: 'Benjamín Ruiz',
        birthDate: '12-20'
    },
    {
        uid: 'user-014',
        email: 'mia.castro@email.com',
        nombre: 'Mía',
        apellido: 'Castro',
        telefono: '+54 11 7890-1234',
        fecha_nacimiento: createBirthday(2, 28, 1995),
        puntos: 180,
        points: 180,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(30),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(25),
        displayName: 'Mía Castro',
        birthDate: '02-28'
    },
    {
        uid: 'user-015',
        email: 'joaquin.moreno@email.com',
        nombre: 'Joaquín',
        apellido: 'Moreno',
        telefono: '+54 11 8901-2345',
        fecha_nacimiento: createBirthday(4, 18, 1991),
        puntos: 150,
        points: 150,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(22),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(35),
        displayName: 'Joaquín Moreno',
        birthDate: '04-18'
    },
    {
        uid: 'user-016',
        email: 'emma.gimenez@email.com',
        nombre: 'Emma',
        apellido: 'Giménez',
        telefono: '+54 11 9012-3456',
        fecha_nacimiento: createBirthday(6, 9, 1994),
        puntos: 120,
        points: 120,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(28),
        notas_internas: 'Primera visita fue en junio',
        role: 'user',
        createdAt: recentDate(20),
        displayName: 'Emma Giménez',
        birthDate: '06-09'
    },
    {
        uid: 'user-017',
        email: 'lucas.medina@email.com',
        nombre: 'Lucas',
        apellido: 'Medina',
        telefono: '+54 11 0123-4567',
        fecha_nacimiento: createBirthday(8, 14, 1989),
        puntos: 95,
        points: 95,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(35),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(15),
        displayName: 'Lucas Medina',
        birthDate: '08-14'
    },
    {
        uid: 'user-018',
        email: 'isabella.silva@email.com',
        nombre: 'Isabella',
        apellido: 'Silva',
        telefono: '+54 11 1234-5678',
        fecha_nacimiento: createBirthday(10, 27, 1992),
        puntos: 70,
        points: 70,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(40),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(18),
        displayName: 'Isabella Silva',
        birthDate: '10-27'
    },
    {
        uid: 'user-019',
        email: 'matias.herrera@email.com',
        nombre: 'Matías',
        apellido: 'Herrera',
        telefono: '+54 11 2345-6789',
        fecha_nacimiento: createBirthday(12, 3, 1990),
        puntos: 45,
        points: 45,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(45),
        notas_internas: 'Referido por Martín López',
        role: 'user',
        createdAt: recentDate(10),
        displayName: 'Matías Herrera',
        birthDate: '12-03'
    },
    {
        uid: 'user-020',
        email: 'olivia.flores@email.com',
        nombre: 'Olivia',
        apellido: 'Flores',
        telefono: '+54 11 3456-7890',
        fecha_nacimiento: createBirthday(3, 21, 1997),
        puntos: 25,
        points: 25,
        nivel_cliente: 'Bronce',
        ultima_visita: recentDate(50),
        notas_internas: '',
        role: 'user',
        createdAt: recentDate(7),
        displayName: 'Olivia Flores',
        birthDate: '03-21'
    }
];

export async function seedUsers(): Promise<{ success: boolean; message: string }> {
    console.log('🌱 Starting user seed process...');
    console.log(`📊 Creating ${SEED_USERS.length} users`);

    try {
        const batch = writeBatch(db);

        for (const user of SEED_USERS) {
            const userRef = doc(collection(db, 'usuarios'), user.uid);
            batch.set(userRef, user);
            console.log(`  ✓ Prepared: ${user.nombre} ${user.apellido} (${user.nivel_cliente})`);
        }

        await batch.commit();

        console.log('\n✅ Seed complete!');
        console.log('\n📅 Users with birthdays this week (Jan 29 - Feb 5):');
        SEED_USERS
            .filter(u => {
                const bd = u.birthDate || '';
                const [m, d] = bd.split('-').map(Number);
                return (m === 1 && d >= 29) || (m === 2 && d <= 5);
            })
            .forEach(u => {
                console.log(`  🎂 ${u.nombre} ${u.apellido} - ${u.birthDate}`);
            });

        console.log('\n📊 Level distribution:');
        console.log(`  🥉 Bronce: ${SEED_USERS.filter(u => u.nivel_cliente === 'Bronce').length}`);
        console.log(`  🥈 Plata: ${SEED_USERS.filter(u => u.nivel_cliente === 'Plata').length}`);
        console.log(`  🥇 Oro: ${SEED_USERS.filter(u => u.nivel_cliente === 'Oro').length}`);

        return {
            success: true,
            message: `✅ ${SEED_USERS.length} usuarios creados exitosamente`
        };
    } catch (error) {
        console.error('❌ Seed failed:', error);
        return {
            success: false,
            message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// Export for use in admin page
export { SEED_USERS };
