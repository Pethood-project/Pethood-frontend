import type { ReactNode } from "react";
import { urlArchivo } from "@/services/api";

/** Primera celda con miniatura (mascota, publicación, campaña). Sin foto, la inicial. */
export function ConFoto({ imagenUrl, texto }: { imagenUrl: string | null; texto: string }) {
  return (
    <span className="flex items-center gap-3">
      {imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlArchivo(imagenUrl)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-sm text-neutral-500">
          {texto.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="font-medium text-neutral-900">{texto}</span>
    </span>
  );
}

interface TablaListadoProps {
  titulo: string;
  descripcion: string;
  columnas: string[];
  /** Una fila por elemento: `celdas` en el mismo orden que `columnas`. */
  filas: { clave: number | string; celdas: ReactNode[] }[];
  /** Texto cuando no hay filas (sin datos o sin coincidencias con el filtro). */
  vacio: string;
  /** Slot a la derecha del título (ej. botón de exportación). */
  accion?: ReactNode;
  /** Slot entre el encabezado y la tabla (filtros). */
  filtros?: ReactNode;
  /** Slot debajo de la tabla (paginación). */
  pie?: ReactNode;
}

// Listado de gestión del panel del refugio, con datos reales de la API. Mismo look que el
// resto del panel; en mobile se apila en tarjetas (.tabla-apilable de globals.css).
export function TablaListado({ titulo, descripcion, columnas, filas, vacio, accion, filtros, pie }: TablaListadoProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">{titulo}</h1>
          <p className="text-base text-neutral-700">{descripcion}</p>
        </div>
        {accion}
      </div>

      {filtros}

      <div className="overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-100 md:overflow-x-auto">
        <table className="tabla-apilable w-full text-left text-base">
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
            {filas.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-8 text-center text-neutral-600">
                  {vacio}
                </td>
              </tr>
            )}
            {filas.map((fila) => (
              <tr key={fila.clave} className="hover:bg-white/60">
                {fila.celdas.map((celda, j) => (
                  <td key={j} data-label={columnas[j]} className="px-4 py-3">
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pie}
    </div>
  );
}
