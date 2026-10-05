"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { plata } from "@/components/admin/Detalle";
import { AccionButton } from "@/components/ui/AccionButton";
import { Pagination } from "@/components/ui/Pagination";
import { useTablaAdmin } from "@/lib/useTablaAdmin";
import type { FiltrosCampanas, ListaCampanas } from "@/types/admin-campanas";
import { DetalleCampanaModal } from "./DetalleCampanaModal";

const CAMPO = "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 sm:w-auto";

export function CampanasTabla({ lista, filtros, token }: { lista: ListaCampanas; filtros: FiltrosCampanas; token: string }) {
  const { aplicarFiltros, irAPagina } = useTablaAdmin("/admin/campanas", filtros);
  const [detalle, setDetalle] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Buscar</span>
          <input
            type="text"
            maxLength={100}
            defaultValue={filtros.q ?? ""}
            placeholder="Título o refugio"
            className={CAMPO}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros({ q: e.currentTarget.value })}
          />
        </label>
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Estado</span>
          <select defaultValue={filtros.estado ?? ""} className={CAMPO} onChange={(e) => aplicarFiltros({ estado: e.target.value || undefined })}>
            <option value="">Todos</option>
            <option value="Inactiva">Inactiva</option>
            <option value="Activa">Activa</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="tabla-apilable w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              {["Campaña", "Refugio", "Estado", "Objetivo", "Período", "Acciones"].map((c) => (
                <th key={c} className="px-4 py-3 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">No hay campañas que coincidan con los filtros.</td>
              </tr>
            )}
            {lista.items.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                <td data-label="Campaña" className="px-4 py-3 text-center text-neutral-900">{c.titulo}</td>
                <td data-label="Refugio" className="px-4 py-3 text-center text-neutral-600">{c.refugio.nombre}</td>
                <td data-label="Estado" className="px-4 py-3 text-center text-neutral-600">{c.estado.nombre}</td>
                <td data-label="Objetivo" className="px-4 py-3 text-center text-neutral-600">{plata(c.objetivo)}</td>
                <td data-label="Período" className="px-4 py-3 text-center text-neutral-600">
                  {new Date(c.fechaInicio).toLocaleDateString("es-AR")} – {new Date(c.fechaFin).toLocaleDateString("es-AR")}
                </td>
                <td data-label="Acciones" className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2 md:justify-center">
                    <AccionButton icono={Eye} tono="info" onClick={() => setDetalle(c.id)}>Ver</AccionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {detalle && <DetalleCampanaModal id={detalle} token={token} onCerrar={() => setDetalle(null)} />}
    </div>
  );
}
