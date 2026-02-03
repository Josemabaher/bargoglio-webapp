import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Bargoglio | Jazz & Cocktails",
  description: "Reserva tu mesa en el mejor club de jazz de la ciudad.",
};

import { AuthProvider } from "@/src/lib/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-stone-950 text-stone-200 font-sans selection:bg-amber-500/30 selection:text-amber-200`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
