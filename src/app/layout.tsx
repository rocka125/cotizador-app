import type { Metadata } from "next";
import { Inter, Fraunces, Archivo } from "next/font/google";
import "./globals.css";

// Matches the PHP app's Google Fonts choices: Inter for body text
// everywhere, Fraunces (serif, italic) for headlines on most pages,
// Archivo (heavy weight) for auditoría's headers.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fortress8 — Cotizador",
  description: "Sistema de cotizaciones Fortress8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
