import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
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
      <body className={`${inter.variable} ${oswald.variable} font-sans min-h-screen bg-background text-text-primary`}>
        {children}
      </body>
    </html>
  );
}
