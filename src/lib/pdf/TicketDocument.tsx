import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
    },
    header: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        color: '#D4AF37', // Gold
    },
    section: {
        margin: 10,
        padding: 10,
        borderBottom: '1px solid #EEE'
    },
    label: {
        fontSize: 10,
        color: '#666',
        marginBottom: 4
    },
    value: {
        fontSize: 14,
        color: '#000',
        fontWeight: 'bold'
    },
    qrSection: {
        marginTop: 40,
        alignItems: 'center'
    }
});

interface TicketProps {
    eventName: string;
    date: string;
    seats: string[];
    reservationId: string;
    qrDataURL: string;
}

export const TicketDocument = ({ eventName, date, seats, reservationId, qrDataURL }: TicketProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text>BARGOGLIO CLUB</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>EVENTO</Text>
                <Text style={styles.value}>{eventName}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>FECHA</Text>
                <Text style={styles.value}>{date}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>UBICACIONES</Text>
                <Text style={styles.value}>{seats.join(', ')}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>ID RESERVA</Text>
                <Text style={styles.value}>{reservationId}</Text>
            </View>

            <View style={styles.qrSection}>
                <Image src={qrDataURL} style={{ width: 150, height: 150 }} />
                <Text style={{ fontSize: 10, marginTop: 10 }}>Presenta este código en la entrada</Text>
            </View>
        </Page>
    </Document>
);
