import { Card } from "@/components/ui/Card";
import type { DonacionPorMes } from "@/types/dashboard";

const COLOR_BARRA = "var(--color-green-300)";
const COLOR_BARRA_ULTIMO_MES = "var(--color-green-600)";
const COLOR_OBJETIVO = "var(--color-sky-600)";

function formatoMoneda(monto: number): string {
  return `$${monto.toLocaleString("es-AR")}`;
}

// Barras verticales + línea de objetivo en CSS puro — mismo criterio que el resto de
// components/dashboard: spec 009 no pide interactividad, así que no suma librería de gráficos.
export function DonacionesChart({ items }: { items: DonacionPorMes[] }) {
  const max = Math.max(1, ...items.flatMap((item) => [item.monto, item.objetivo]));
  const ultimoMes = items.at(-1)?.mes;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Flujo de donaciones</h2>
        <div className="flex shrink-0 items-center gap-3 text-sm font-medium text-neutral-700">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_BARRA_ULTIMO_MES }} />
            Recaudado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full" style={{ background: COLOR_OBJETIVO }} />
            Objetivo
          </span>
        </div>
      </div>
      <div className="mt-6 flex flex-1 justify-between gap-2">
        {items.map((item) => (
          <div key={item.mes} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900">{formatoMoneda(item.monto)}</span>
            <div className="relative w-full flex-1">
              <div
                className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-14 rounded-t-sm transition-[height] duration-500 ease-out"
                style={{
                  height: `${(item.monto / max) * 100}%`,
                  background: item.mes === ultimoMes ? COLOR_BARRA_ULTIMO_MES : COLOR_BARRA,
                }}
                title={`${item.mes}: ${formatoMoneda(item.monto)}`}
              />
              <div
                className="absolute inset-x-0 border-t-2 border-dashed"
                style={{ bottom: `${(item.objetivo / max) * 100}%`, borderColor: COLOR_OBJETIVO }}
                title={`Objetivo: ${formatoMoneda(item.objetivo)}`}
              />
            </div>
            <span className="text-sm font-medium text-neutral-700">{item.mes}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
