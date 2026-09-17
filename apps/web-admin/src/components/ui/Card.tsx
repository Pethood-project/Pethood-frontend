import type { ReactNode } from "react";
import Link from "next/link";

// Radio, borde y sombra tomados de GUI-15.1.1 (pantallas/PetHood App (standalone).html): radio
// 16px, borde neutral-300 y sombra tintada cálida (no gris) en vez del shadow-sm/md por defecto.
const BASE =
  "rounded-2xl p-6 shadow-[0_1px_5px_rgba(150,120,80,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(150,120,80,0.16)]";
const SUPERFICIE_DEFECTO = "border border-neutral-300 bg-neutral-100";

interface CardProps {
  className?: string;
  /** Fondo + borde de la tarjeta. Reemplaza el blanco por defecto (ej. la tarjeta destacada de KpiCard). */
  superficie?: string;
  href?: string;
  children: ReactNode;
}

// Estilo de tarjeta compartido por los widgets del dashboard (GUI-39) — un solo lugar
// para el look "moderno" (sombra + hover) en vez de repetirlo en cada componente.
// "superficie" (bg/border) va separado de BASE a propósito: si un consumidor necesita
// pisar el fondo blanco por className, dos utilidades de "bg-*" con la misma especificidad
// compiten por orden de generación de Tailwind (no por orden en el HTML) y el resultado es
// impredecible — separarlas evita que dos clases "bg-*" convivan en el mismo elemento.
// Sin "display" en BASE: className puede pedir flex/h-full (GraficoPublicacionesPorMes)
// sin pisar un "block" de base que compita por especificidad.
// Con href se renderiza como link (KPIs que llevan a su pantalla de gestión).
export function Card({ className = "", superficie = SUPERFICIE_DEFECTO, href, children }: CardProps) {
  if (href) {
    return (
      <Link href={href} className={`block ${BASE} ${superficie} ${className}`}>
        {children}
      </Link>
    );
  }
  return <div className={`${BASE} ${superficie} ${className}`}>{children}</div>;
}
