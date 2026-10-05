import type { ReactNode } from "react";

interface ListaMockProps {
  titulo: string;
  descripcion: string;
  columnas: string[];
  filas: string[][];
  /** Slot a la derecha del título (ej. botón de exportación). */
  accion?: ReactNode;
}

// Primera página de un listado todavía sin backend/pantalla real: tabla con datos de ejemplo.
// Se reemplaza por la pantalla definitiva cuando exista el endpoint (ver backend/BACKEND_PENDIENTE_ADMIN.md).
export function ListaMock({ titulo, descripcion, columnas, filas, accion }: ListaMockProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">{titulo}</h1>
          <p className="text-base text-neutral-700">{descripcion}</p>
        </div>
        {accion}
      </div>

      <p className="rounded-lg border border-dashed border-pethood-orange/50 bg-pethood-orange/5 px-4 py-2 text-sm text-pethood-orange-dark">
        Vista de ejemplo: los datos son ficticios hasta conectar este listado con la API.
      </p>

      <div className="overflow-hidden rounded-2xl md:overflow-x-auto border border-neutral-300 bg-neutral-100">
        <table className="tabla-apilable w-full min-w-max text-left text-base">
          <thead className="border-b border-neutral-300 text-sm uppercase tracking-wide text-neutral-600">
            <tr>
              {columnas.map((c) => (
                <th key={c} className="px-4 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-neutral-800">
            {filas.map((fila, i) => (
              <tr key={i} className="hover:bg-white/60">
                {fila.map((celda, j) => (
                  <td key={j} data-label={columnas[j]} className="px-4 py-3">
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
