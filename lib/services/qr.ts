import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        console.error('Error generating QR code', err);
        throw new Error('Failed to generate QR code');
    }
}
