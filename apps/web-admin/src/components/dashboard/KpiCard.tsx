import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Mismos tonos que los íconos de KPI de GUI-15.1.1: círculo amarillo pálido + marrón/naranja
// para métricas de crecimiento, gris cálido para conteos simples, verde oliva para positivas,
// rojo para alertas (único frío que se conserva, para que siga leyendo como "peligro").
const COLORES_BADGE = {
  naranja: "bg-pethood-badge text-pethood-accent-700",
  verde: "bg-pethood-success-100 text-pethood-success-700",
  celeste: "bg-neutral-200 text-neutral-700",
  rojo: "bg-red-50 text-red-600",
} as const;

interface KpiCardProps {
  etiqueta: string;
  valor: number | string;
  icono: LucideIcon;
  color: keyof typeof COLORES_BADGE;
  href?: string;
  /** Tarjeta con fondo sólido en vez de blanco, para destacar un KPI sobre el resto (ej. donaciones). */
  destacado?: boolean;
  /** Texto chico debajo del valor, ej. "Objetivo: $50.000". */
  nota?: string;
}

export function KpiCard({ etiqueta, valor, icono: Icono, color, href, destacado = false, nota }: KpiCardProps) {
  if (destacado) {
    return (
      <Card
        href={href}
        superficie="border border-transparent bg-linear-to-br from-green-600 to-green-700"
        className="text-white"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/90 sm:text-sm">{etiqueta}</p>
          <span className="flex h-9 w-9 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-white/15">
            <Icono className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
        </div>
        <p className="mt-2 font-heading text-3xl tracking-tight sm:text-5xl">{valor}</p>
        {nota && <p className="mt-1 text-xs font-medium sm:text-sm text-white/90">{nota}</p>}
      </Card>
    );
  }

  return (
    <Card href={href}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600 sm:text-sm">{etiqueta}</p>
        <span className={`flex h-9 w-9 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-lg ${COLORES_BADGE[color]}`}>
          <Icono className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-2 font-heading text-3xl tracking-tight sm:text-5xl text-neutral-900">{valor}</p>
      {nota && <p className="mt-1 text-xs font-medium sm:text-sm text-neutral-600">{nota}</p>}
    </Card>
  );
}
