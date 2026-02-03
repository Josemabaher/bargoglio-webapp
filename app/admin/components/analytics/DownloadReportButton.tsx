"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { AnalyticsPDF } from "./AnalyticsPDF";
import { FaFilePdf } from "react-icons/fa";

interface DownloadReportButtonProps {
    data: any;
}

export default function DownloadReportButton({ data }: DownloadReportButtonProps) {
    if (!data) return null;

    return (
        <PDFDownloadLink
            document={<AnalyticsPDF data={data} />}
            fileName={`reporte-bargoglio-${new Date().toISOString().split('T')[0]}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg shadow-lg shadow-gold-900/20 transition-all text-sm"
        >
            {({ blob, url, loading, error }) => (
                <>
                    <FaFilePdf />
                    {loading ? 'Generando...' : 'Reporte Mensual'}
                </>
            )}
        </PDFDownloadLink>
    );
}
