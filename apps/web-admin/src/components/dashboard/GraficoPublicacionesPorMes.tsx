import { Card } from "@/components/ui/Card";
import type { PublicacionPorMes } from "@/types/dashboard";

const COLOR_PUBLICACIONES = "var(--color-pethood-accent-600)";
const COLOR_ADOPCIONES = "var(--color-pethood-success-600)";

// Barras verticales agrupadas en CSS puro — mismo criterio que BarList/DonutChart:
// spec 009 no pide interactividad, así que no suma una librería de gráficos para esto.
export function GraficoPublicacionesPorMes({
  items,
}: {
  items: PublicacionPorMes[];
}) {
  const max = Math.max(
    1,
    ...items.flatMap((item) => [item.publicaciones, item.adopciones]),
  );

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          Publicaciones y adopciones (últimos 6 meses)
        </h2>
        <div className="flex shrink-0 items-center gap-3 text-sm font-medium text-neutral-700">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR_PUBLICACIONES }}
            />
            Publicaciones
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR_ADOPCIONES }}
            />
            Adopciones
          </span>
        </div>
      </div>
      <div className="mt-6 flex flex-1 justify-between gap-2">
        {items.map((item) => (
          <div
            key={item.mes}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div className="flex w-full flex-1 items-end justify-center gap-1">
              <div
                className="w-full max-w-15 rounded-t-sm transition-[height] duration-500 ease-out"
                style={{
                  height: `${(item.publicaciones / max) * 100}%`,
                  background: COLOR_PUBLICACIONES,
                }}
                title={`Publicaciones: ${item.publicaciones}`}
              />
              <div
                className="w-full max-w-15 rounded-t-sm transition-[height] duration-500 ease-out"
                style={{
                  height: `${(item.adopciones / max) * 100}%`,
                  background: COLOR_ADOPCIONES,
                }}
                title={`Adopciones: ${item.adopciones}`}
              />
            </div>
            <span className="text-sm font-medium text-neutral-700">{item.mes}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
