import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface DonutChartProps {
  titulo: string;
  items: { etiqueta: string; valor: number }[];
}

// Mismos tokens que las badges de KpiCard.tsx, para que el color de un estado se lea igual
// en toda la pantalla. Las claves son los literales de EstadoSolicitud (backend/prisma/seed.ts:
// Pendiente, En_Revision, Aprobada, Rechazada, Cancelada) — acá también les damos su etiqueta
// en español, porque "En_Revision" es un valor técnico, no un texto para mostrar.
const CONFIG_ESTADO: Record<string, { etiqueta: string; color: string }> = {
  Pendiente: { etiqueta: "Pendiente", color: "var(--color-pethood-orange-dark)" },
  En_Revision: { etiqueta: "En revisión", color: "var(--color-sky-600)" },
  Aprobada: { etiqueta: "Aprobada", color: "var(--color-green-600)" },
  Rechazada: { etiqueta: "Rechazada", color: "var(--color-red-500)" },
  Cancelada: { etiqueta: "Cancelada", color: "var(--color-neutral-400)" },
};
const CONFIG_RESERVA = { color: "var(--color-sky-600)" };

function configDe(estado: string) {
  return CONFIG_ESTADO[estado] ?? { etiqueta: estado.replace(/_/g, " "), ...CONFIG_RESERVA };
}

// Radio elegido para que la circunferencia dé ~100 (2πr ≈ 100.0): así el % de cada estado se usa
// directo como longitud del segmento en strokeDasharray, sin tener que reescalar.
const RADIO = 15.9155;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

// Dona en SVG (arcos vía stroke-dasharray) en vez de conic-gradient: cada segmento es un <circle>
// propio con su <title>, así el navegador muestra un tooltip nativo con la cantidad al pasar el
// mouse por ese color — mismo criterio que BarList de no sumar una librería de gráficos para esto.
export function DonutChart({ titulo, items }: DonutChartProps) {
  const total = items.reduce((acc, item) => acc + item.valor, 0) || 1;

  const segmentos = items.reduce<{ acumulado: number; partes: ReactNode[] }>(
    (acc, item) => {
      const { etiqueta, color } = configDe(item.etiqueta);
      const largo = (item.valor / total) * CIRCUNFERENCIA;
      const partes = [
        ...acc.partes,
        <circle
          key={item.etiqueta}
          cx="18"
          cy="18"
          r={RADIO}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
          strokeDashoffset={-acc.acumulado}
          className="transition-opacity hover:opacity-70"
        >
          <title>{`${etiqueta}: ${item.valor}`}</title>
        </circle>,
      ];
      return { acumulado: acc.acumulado + largo, partes };
    },
    { acumulado: 0, partes: [] },
  );

  return (
    <Card>
      <h2 className="text-sm font-semibold text-neutral-900">{titulo}</h2>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
            {segmentos.partes}
          </svg>
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-base font-semibold leading-none text-neutral-900">{total}</span>
            <span className="mt-1 text-[10px] leading-none text-neutral-500">total</span>
          </div>
        </div>
        <ul className="w-full space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.etiqueta} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: configDe(item.etiqueta).color }}
              />
              <span className="text-neutral-800">{configDe(item.etiqueta).etiqueta}</span>
              <span className="ml-auto font-medium text-neutral-900">
                {Math.round((item.valor / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
