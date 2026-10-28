import { Card } from "@/components/ui/Card";

import type { LucideIcon } from "lucide-react";

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
  /**
   * Avance de 0 a 1 hacia un objetivo (ej. recaudado / objetivo). Solo en la tarjeta destacada:
   * dibuja la barra clara de la BarraProgreso de campañas de la app. Mayor a 1 se corta en 1.
   */
  progreso?: number;
}

// La tarjeta es un container (@container) y el valor achica la letra según su largo y el ancho
// real de la tarjeta: con montos grandes (ej. "$12.345.678") no se sale del cuadrante, ni en
// la grilla de 4 columnas angostas de md. Tope: el tamaño de siempre (3xl / 5xl desde sm).
// ~0.62em por carácter es el ancho de un dígito tabular de la fuente de títulos, con margen.
const ANCHO_CARACTER_EM = 0.62;

const VALOR =
  "mt-2 font-heading leading-tight tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis [--kpi-max:1.875rem] sm:[--kpi-max:3rem]";

function estiloValor(valor: number | string) {
  const largo = Math.max(1, String(valor).length);
  return { fontSize: `min(var(--kpi-max), ${(100 / (largo * ANCHO_CARACTER_EM)).toFixed(2)}cqw)` };
}

export function KpiCard({ etiqueta, valor, icono: Icono, color, href, destacado = false, nota, progreso }: KpiCardProps) {
  const estilo = estiloValor(valor);

  if (destacado) {
    return (
      <Card
        href={href}
        // Verde claro de donaciones (globals.css) con texto verde oscuro: el blanco no llega a
        // contraste legible sobre un verde tan claro.
        superficie="border border-transparent bg-pethood-donacion-400"
        className="@container min-w-0 text-pethood-donacion-900"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-wide text-pethood-donacion-900/80 sm:text-sm @max-[8rem]:text-[11px] @max-[8rem]:tracking-normal">{etiqueta}</p>
          <span className="flex h-9 w-9 shrink-0 @max-[8rem]:hidden sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-white/40">
            <Icono className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
        </div>
        <p className={VALOR} style={estilo} title={String(valor)}>{valor}</p>
        {nota && <p className="mt-1 break-words text-xs font-medium sm:text-sm text-pethood-donacion-900/80">{nota}</p>}
        {progreso !== undefined && (
          // Decorativa: la nota ya dice el objetivo en texto.
          <div aria-hidden className="mt-3 h-2 rounded-full bg-pethood-donacion-600/50">
            <div
              className="h-2 rounded-full bg-white transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(1, Math.max(0, progreso)) * 100}%` }}
            />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card href={href} className="@container min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-wide text-neutral-600 sm:text-sm @max-[8rem]:text-[11px] @max-[8rem]:tracking-normal">{etiqueta}</p>
        <span className={`flex h-9 w-9 shrink-0 @max-[8rem]:hidden sm:h-11 sm:w-11 items-center justify-center rounded-lg ${COLORES_BADGE[color]}`}>
          <Icono className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
        </span>
      </div>
      <p className={`${VALOR} text-neutral-900`} style={estilo} title={String(valor)}>{valor}</p>
      {nota && <p className="mt-1 break-words text-xs font-medium sm:text-sm text-neutral-600">{nota}</p>}
    </Card>
  );
}
