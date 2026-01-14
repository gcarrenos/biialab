import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BiiALab - La plataforma educativa más grande de Latinoamérica",
  description: "Cursos de AI, Machine Learning y tecnología de vanguardia. Aprende de los mejores expertos del mundo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-text-primary`}>
        {children}
      </body>
    </html>
  );
}
