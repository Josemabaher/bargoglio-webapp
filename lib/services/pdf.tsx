import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image } from '@react-pdf/renderer';
import { generateQRCode } from './qr';
import React from 'react';

// Common styles for the ticket
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#111',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        color: '#666',
        marginTop: 5
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 5
    },
    label: {
        fontSize: 10,
        color: '#888'
    },
    value: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    qrContainer: {
        alignItems: 'center',
        marginTop: 30,
        padding: 20,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8
    },
    qrCode: {
        width: 200,
        height: 200
    },
    footer: {
        marginTop: 30,
        fontSize: 10,
        textAlign: 'center',
        color: '#999'
    }
});

export interface OrderDetails {
    id: string;
    customerName: string;
    date: string; // ISO date string or formatted date
    eventName?: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
}

const TicketDocument = ({ order, qrCodeUrl }: { order: OrderDetails, qrCodeUrl: string }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Bargoglio</Text>
                <Text style={styles.subtitle}>Entry Ticket</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>ORDER ID</Text>
                        <Text style={styles.value}>{order.id}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>DATE</Text>
                        <Text style={styles.value}>{order.date}</Text>
                    </View>
                </View>

                <View style={{ ...styles.row, marginTop: 10 }}>
                    <View>
                        <Text style={styles.label}>ATTENDEE</Text>
                        <Text style={styles.value}>{order.customerName}</Text>
                    </View>
                </View>

                {order.eventName && (
                    <View style={{ ...styles.row, marginTop: 10 }}>
                        <View>
                            <Text style={styles.label}>EVENT</Text>
                            <Text style={styles.value}>{order.eventName}</Text>
                        </View>
                    </View>
                )}

                <View style={{ marginTop: 20 }}>
                    <Text style={{ ...styles.label, marginBottom: 5 }}>ITEMS</Text>
                    {order.items.map((item, index) => (
                        <View key={index} style={styles.row}>
                            <Text style={styles.value}>{item.quantity}x {item.name}</Text>
                            <Text style={styles.value}>${item.price.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ marginTop: 10, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                        Total: ${order.total.toFixed(2)}
                    </Text>
                </View>

                <View style={styles.qrContainer}>
                    <Image src={qrCodeUrl} style={styles.qrCode} />
                    <Text style={{ ...styles.label, marginTop: 10 }}>Scan at entrance</Text>
                </View>
            </View>

            <Text style={styles.footer}>
                Bargoglio - Please present this ticket at the door.
            </Text>
        </Page>
    </Document>
);

/**
 * Generate a PDF Buffer for the order ticket
 */
export async function generateTicketPDF(order: OrderDetails): Promise<Buffer> {
    // Generate QR code with order ID
    const qrCodeUrl = await generateQRCode(order.id);
    // Render PDF to buffer
    return await renderToBuffer(<TicketDocument order={order} qrCodeUrl={qrCodeUrl} />);
}
