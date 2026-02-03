import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
    header: { marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#d4af37', paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', textTransform: 'uppercase' },
    subtitle: { fontSize: 10, color: '#666', marginTop: 4 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#d4af37', marginBottom: 10, textTransform: 'uppercase' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    label: { fontSize: 10, color: '#444' },
    value: { fontSize: 10, fontWeight: 'bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { width: '48%', padding: 10, backgroundColor: '#f9f9f9', marginBottom: 10, borderRadius: 4 },
    cardTitle: { fontSize: 8, color: '#888', textTransform: 'uppercase' },
    cardValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginTop: 4 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4, marginBottom: 4 },
    tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
});

interface AnalyticsPDFProps {
    data: any;
}

export function AnalyticsPDF({ data }: AnalyticsPDFProps) {
    const today = format(new Date(), 'dd/MM/yyyy');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>BARGOGLIO</Text>
                    <Text style={styles.subtitle}>Reporte Mensual de Insights • Generado el {today}</Text>
                </View>

                {/* Summary Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
                    <View style={styles.grid}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Ingresos Totales (Mes)</Text>
                            <Text style={styles.cardValue}>${data.revenue.total.toLocaleString()}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Ticket Promedio</Text>
                            <Text style={styles.cardValue}>${Math.round(data.revenue.ticketAverage).toLocaleString()}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Ocupación Promedio</Text>
                            <Text style={styles.cardValue}>{data.occupancy.average}%</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tasa de Retención</Text>
                            <Text style={styles.cardValue}>{data.loyalty.retentionRate}%</Text>
                        </View>
                    </View>
                </View>

                {/* Revenue Detail */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Desglose de Ingresos</Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.label, { width: '60%' }]}>Periodo / Show</Text>
                        <Text style={[styles.label, { width: '40%', textAlign: 'right' }]}>Monto</Text>
                    </View>
                    {data.revenue.byMonth.slice(0, 5).map((m: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.value, { width: '60%' }]}>{m.name}</Text>
                            <Text style={[styles.value, { width: '40%', textAlign: 'right' }]}>${m.value.toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                {/* Zones */}
                <View style={[styles.section, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>Zonas Más Populares</Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.label, { width: '60%' }]}>Zona</Text>
                        <Text style={[styles.label, { width: '40%', textAlign: 'right' }]}>Reservas</Text>
                    </View>
                    {data.heatmap.popularZones.slice(0, 5).map((z: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.value, { width: '60%' }]}>{z.name}</Text>
                            <Text style={[styles.value, { width: '40%', textAlign: 'right' }]}>{z.value}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
                    <Text style={{ fontSize: 8, color: '#888', textAlign: 'center' }}>
                        Documento confidencial para uso interno de Bargoglio Club.
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
