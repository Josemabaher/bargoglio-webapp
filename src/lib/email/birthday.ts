import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BirthdayEmailData {
    to: string;
    userName: string;
}

export async function sendBirthdayEmail({ to, userName }: BirthdayEmailData) {
    try {
        await resend.emails.send({
            from: 'Bargoglio <saludos@bargoglio.com>',
            to: [to],
            subject: `🎂 ¡Feliz Cumpleaños, ${userName}! - Bargoglio Club`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Georgia, serif;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%); border: 1px solid #d4af37;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #d4af37;">
            <h1 style="color: #d4af37; font-size: 32px; margin: 0; letter-spacing: 4px;">BARGOGLIO</h1>
            <p style="color: #888; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 2px;">Club de Jazz</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 50px 30px; text-align: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">🎂</div>
            
            <h2 style="color: #fff; font-size: 28px; margin: 0 0 20px 0;">
                ¡Feliz Cumpleaños, <span style="color: #d4af37;">${userName}</span>!
            </h2>
            
            <p style="color: #ccc; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                En Bargoglio, queremos celebrar este día tan especial junto a vos.<br />
                Porque sos parte de nuestra familia, te tenemos preparado un regalo.
            </p>
            
            <!-- Benefit Box -->
            <div style="background: rgba(212, 175, 55, 0.15); border: 2px solid #d4af37; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">
                    Tu Beneficio de Cumpleaños
                </p>
                <p style="color: #d4af37; font-size: 28px; font-weight: bold; margin: 0;">
                    🎁 Por definir
                </p>
                <p style="color: #999; font-size: 14px; margin-top: 15px;">
                    Comunicate con nosotros para canjear tu beneficio
                </p>
            </div>
            
            <p style="color: #888; font-size: 14px; line-height: 1.6;">
                Te esperamos para brindar juntos.<br />
                ¡Que tengas un día increíble!
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px; border-top: 1px solid #333; background: #111;">
            <p style="color: #666; font-size: 12px; margin: 0;">
                Bargoglio Club | Buenos Aires, Argentina
            </p>
            <p style="color: #444; font-size: 10px; margin-top: 10px;">
                Este email fue enviado automáticamente porque hoy es tu cumpleaños 🎉
            </p>
        </div>
    </div>
</body>
</html>
            `
        });
        console.log("[Birthday Email] Sent to:", to);
        return true;
    } catch (error) {
        console.error("[Birthday Email] Error:", error);
        return false;
    }
}
