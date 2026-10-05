"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { AccionButton } from "@/components/ui/AccionButton";
import { Feedback } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { useTablaAdmin } from "@/lib/useTablaAdmin";
import { urlArchivo } from "@/services/api";
import type { FiltrosReportes, ListaReportes, TipoReporte } from "@/types/admin-reportes";
import { DetalleReporteModal } from "./DetalleReporteModal";

export const TIPOS: Record<TipoReporte, string> = {
  PUBLICACION: "Publicación",
  USUARIO: "Persona",
  REFUGIO: "Refugio",
  RESENA: "Reseña",
  ANIMAL_PERDIDO: "Aviso de mascota perdida",
  CAMPANIA: "Campaña",
  MENSAJE: "Mensaje",
};

const CAMPO = "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 sm:w-auto";

export function ReportesTabla({ lista, filtros, token }: { lista: ListaReportes; filtros: FiltrosReportes; token: string }) {
  const { error, exito, ejecutar, aplicarFiltros, irAPagina } = useTablaAdmin("/admin/moderacion", filtros);
  const [abierto, setAbierto] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Estado</span>
          <select className={CAMPO} defaultValue={filtros.estado} onChange={(e) => aplicarFiltros({ estado: e.target.value })}>
            <option value="pendiente">Pendientes</option>
            <option value="resuelto">Resueltos</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Tipo</span>
          <select className={CAMPO} defaultValue={filtros.tipo ?? ""} onChange={(e) => aplicarFiltros({ tipo: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(TIPOS).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <Feedback tipo="error" mensaje={error} />}
      {exito && <Feedback tipo="exito" mensaje={exito} />}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="tabla-apilable w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              {["Tipo", "Reportado", "Motivo", "Reportante", "Estado", "Fecha", "Acciones"].map((c) => (
                <th key={c} className="px-4 py-3 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No hay reportes que coincidan con los filtros.
                </td>
              </tr>
            )}
            {lista.items.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                <td data-label="Tipo" className="px-4 py-3 text-center text-neutral-900">{TIPOS[r.tipo]}</td>
                <td data-label="Reportado" className="px-4 py-3 text-neutral-600">
                  <div className="flex items-center justify-center gap-2">
                    {r.objeto.imagenUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlArchivo(r.objeto.imagenUrl)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 text-left">
                      <p className="truncate">{r.objeto.etiqueta ?? `#${r.objeto.id} (no disponible)`}</p>
                      {r.objeto.reportesTotales > 1 && (
                        <p className="text-xs text-amber-700">
                          {r.objeto.reportesPendientes} pendiente(s) · {r.objeto.reportesTotales} en total
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td data-label="Motivo" className="max-w-xs truncate px-4 py-3 text-center text-neutral-600" title={r.motivo}>
                  {r.motivo}
                </td>
                <td data-label="Reportante" className="px-4 py-3 text-center text-neutral-600">
                  {r.reportante ? `${r.reportante.nombre} ${r.reportante.apellido}` : "—"}
                </td>
                <td data-label="Estado" className="px-4 py-3 text-center text-neutral-600">{r.resuelto ? "Resuelto" : "Pendiente"}</td>
                <td data-label="Fecha" className="px-4 py-3 text-center text-neutral-600">{new Date(r.fechaAlta).toLocaleDateString("es-AR")}</td>
                <td data-label="Acciones" className="px-4 py-3">
                  <div className="flex justify-center">
                    <AccionButton icono={Eye} tono="info" onClick={() => setAbierto(r.id)}>
                      Ver
                    </AccionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {abierto !== null && (
        <DetalleReporteModal
          id={abierto}
          token={token}
          onCerrar={() => setAbierto(null)}
          onCambio={(mensaje) => ejecutar(abierto, async () => undefined, mensaje)}
        />
      )}
    </div>
  );
}
