import * as XLSX from 'xlsx';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

// Interfaces
interface Attendee {
    id: string;
    name: string;
    email: string;
    ticketType: string;
    price: number;
    checkInStatus: 'Pending' | 'Checked In';
}

/**
 * Generate Excel file buffer for attendees
 */
export function generateAttendeeExcel(attendees: Attendee[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(attendees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');

    // write to buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return excelBuffer;
}

// PDF Styles
const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10 },
    header: { marginBottom: 20, fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
    tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 }
});

const AttendeeListDocument = ({ attendees, date }: { attendees: Attendee[], date: string }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Attendee List - {date}</Text>

            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>Name</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>Email</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>Ticket</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>Status</Text></View>
                </View>

                {attendees.map((att) => (
                    <View style={styles.tableRow} key={att.id}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{att.name}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{att.email}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{att.ticketType}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{att.checkInStatus}</Text></View>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

/**
 * Generate PDF file buffer for attendees
 */
export async function generateAttendeePDF(attendees: Attendee[], date: string): Promise<Buffer> {
    return await renderToBuffer(<AttendeeListDocument attendees={attendees} date={date} />);
}
