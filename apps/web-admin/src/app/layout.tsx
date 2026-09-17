import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Figtree, Caprasimo } from "next/font/google";
import "./globals.css";

// Mismas tipografías que apps/mobile (constants/theme.js FUENTES) y que el diseño de
// referencia (pantallas/PetHood App (standalone).html): Caprasimo para títulos/números
// destacados, Figtree para el resto del texto.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caprasimo = Caprasimo({
  variable: "--font-caprasimo",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetHood — Panel",
  description: "Panel de administración de PetHood",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${figtree.variable} ${caprasimo.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Fondo vía --background (globals.css): esa regla body{} no está en @layer, así que
          le gana a cualquier clase bg-* de Tailwind puesta acá — no duplicar el color acá. */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
