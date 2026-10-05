import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface BarListProps {
  titulo: string;
  /** Slot opcional a la derecha del título (ej. botón de exportación). */
  accion?: ReactNode;
  items: { etiqueta: string; valor: number }[];
}

// Barras con CSS puro, sin librería de gráficos — alcance de spec 009 no pide interactividad.
export function BarList({ titulo, items, accion }: BarListProps) {
  const max = Math.max(1, ...items.map((item) => item.valor));

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">{titulo}</h2>
        {accion}
      </div>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <li key={item.etiqueta} className="text-base">
            <div className="flex justify-between text-neutral-800">
              <span>{item.etiqueta}</span>
              <span className="font-medium text-neutral-900">{item.valor}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-neutral-200">
              <div
                className="h-2.5 rounded-full bg-pethood-orange transition-[width] duration-500 ease-out"
                style={{ width: `${(item.valor / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
