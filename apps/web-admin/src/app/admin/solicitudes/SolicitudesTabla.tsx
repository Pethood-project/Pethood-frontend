"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { AccionButton } from "@/components/ui/AccionButton";
import { Feedback } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { useTablaAdmin } from "@/lib/useTablaAdmin";
import { validarRangoFechas } from "@/lib/validation";
import { DetalleSolicitudModal } from "./DetalleSolicitudModal";
import type { FiltrosModeracion, Lista, SolicitudAdmin } from "@/types/admin-moderacion";

const CAMPO = "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 sm:w-auto";

export function SolicitudesTabla({ lista, filtros, token }: { lista: Lista<SolicitudAdmin>; filtros: FiltrosModeracion; token: string }) {
  const { aplicarFiltros: navegar, irAPagina } = useTablaAdmin("/admin/solicitudes", filtros);
  const [detalle, setDetalle] = useState<number | null>(null);
  const [errorFechas, setErrorFechas] = useState<string | null>(null);

  // El rango se valida antes de pedir: no tiene sentido mandar desde > hasta al backend.
  function aplicarFiltros(nuevos: Partial<FiltrosModeracion>) {
    const { desde, hasta } = { ...filtros, ...nuevos };
    const error = validarRangoFechas(desde, hasta);
    setErrorFechas(error);
    if (!error) navegar(nuevos);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Buscar</span>
          <input
            type="text"
            maxLength={100}
            defaultValue={filtros.q ?? ""}
            placeholder="Mascota, solicitante o email"
            className={CAMPO}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros({ q: e.currentTarget.value })}
          />
        </label>
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Tipo</span>
          <input
            type="text"
            maxLength={100}
            defaultValue={filtros.tipo ?? ""}
            placeholder="Adopcion, Transito…"
            className={CAMPO}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros({ tipo: e.currentTarget.value })}
          />
        </label>
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Desde</span>
          <input type="date" defaultValue={filtros.desde ?? ""} className={CAMPO} onChange={(e) => aplicarFiltros({ desde: e.target.value })} />
        </label>
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Hasta</span>
          <input type="date" defaultValue={filtros.hasta ?? ""} className={CAMPO} onChange={(e) => aplicarFiltros({ hasta: e.target.value })} />
        </label>
      </div>

      {errorFechas && <Feedback tipo="error" mensaje={errorFechas} />}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="tabla-apilable w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              {["Mascota", "Solicitante", "Refugio", "Tipo", "Estado", "Fecha", "Acciones"].map((c) => (
                <th key={c} className="px-4 py-3 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No hay solicitudes que coincidan con los filtros.
                </td>
              </tr>
            )}
            {lista.items.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                <td data-label="Mascota" className="px-4 py-3 text-center text-neutral-900">
                  <button type="button" onClick={() => setDetalle(s.id)} className="font-medium text-neutral-900 hover:underline">
                      {s.mascota.nombre}
                    </button>
                </td>
                <td data-label="Solicitante" className="px-4 py-3 text-center text-neutral-600">{s.solicitante.nombre}</td>
                <td data-label="Refugio" className="px-4 py-3 text-center text-neutral-600">{s.refugio?.nombre ?? "—"}</td>
                <td data-label="Tipo" className="px-4 py-3 text-center text-neutral-600">{s.tipo}</td>
                <td data-label="Estado" className="px-4 py-3 text-center text-neutral-600">{s.estado.nombre}</td>
                <td data-label="Fecha" className="px-4 py-3 text-center text-neutral-600">{new Date(s.fechaAlta).toLocaleDateString("es-AR")}</td>
                <td data-label="Acciones" className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2 md:justify-center">
                    <AccionButton icono={Eye} tono="info" onClick={() => setDetalle(s.id)}>Ver</AccionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {detalle && <DetalleSolicitudModal id={detalle} token={token} onCerrar={() => setDetalle(null)} />}
    </div>
  );
}
