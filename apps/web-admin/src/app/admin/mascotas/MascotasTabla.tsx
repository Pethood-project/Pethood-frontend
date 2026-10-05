"use client";

import { useState } from "react";
import { Eye, RotateCcw, Trash2 } from "lucide-react";
import { MotivoModal } from "@/components/admin/MotivoModal";
import { AccionButton } from "@/components/ui/AccionButton";
import { Feedback } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { useTablaAdmin } from "@/lib/useTablaAdmin";
import { bajaMascota, reactivarMascota } from "@/services/admin-moderacion";
import { DetalleMascotaModal } from "./DetalleMascotaModal";
import type { FiltrosModeracion, Lista, MascotaAdmin } from "@/types/admin-moderacion";

const CAMPO = "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 sm:w-auto";

export function MascotasTabla({
  lista,
  filtros,
  token,
}: {
  lista: Lista<MascotaAdmin>;
  filtros: FiltrosModeracion;
  token: string;
}) {
  const { cargando, error, exito, ejecutar, aplicarFiltros, irAPagina } = useTablaAdmin("/admin/mascotas", filtros);
  const [detalle, setDetalle] = useState<number | null>(null);
  const [modal, setModal] = useState<{ mascota: MascotaAdmin; baja: boolean } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Buscar</span>
          <input
            type="text"
            maxLength={100}
            defaultValue={filtros.q ?? ""}
            placeholder="Nombre"
            className={CAMPO}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros({ q: e.currentTarget.value })}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            defaultChecked={filtros.incluirBajas === "true"}
            onChange={(e) => aplicarFiltros({ incluirBajas: e.target.checked ? "true" : undefined })}
          />
          Incluir bajas
        </label>
      </div>

      {error && <Feedback tipo="error" mensaje={error} />}
      {exito && <Feedback tipo="exito" mensaje={exito} />}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="tabla-apilable w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              {["Nombre", "Especie", "Estado", "Dueño", "Publicada", "Alta", "Acciones"].map((c) => (
                <th key={c} className="px-4 py-3 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No hay mascotas que coincidan con los filtros.
                </td>
              </tr>
            )}
            {lista.items.map((m) => {
              const deBaja = m.fechaBaja !== null;
              return (
                <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                  <td data-label="Nombre" className="px-4 py-3 text-center text-neutral-900">
                    <button type="button" onClick={() => setDetalle(m.id)} className="font-medium text-neutral-900 hover:underline">
                      {m.nombre}
                    </button>
                  </td>
                  <td data-label="Especie" className="px-4 py-3 text-center text-neutral-600">{m.especie}{m.raza ? ` · ${m.raza}` : ""}</td>
                  <td data-label="Estado" className="px-4 py-3 text-center text-neutral-600">{deBaja ? "De baja" : m.estado.nombre}</td>
                  <td data-label="Dueño" className="px-4 py-3 text-center text-neutral-600">{m.duenio.nombre}</td>
                  <td data-label="Publicada" className="px-4 py-3 text-center text-neutral-600">{m.tienePublicacionActiva ? "Sí" : "No"}</td>
                  <td data-label="Alta" className="px-4 py-3 text-center text-neutral-600">{new Date(m.fechaAlta).toLocaleDateString("es-AR")}</td>
                  <td data-label="Acciones" className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2 md:justify-center">
                      <AccionButton icono={Eye} tono="info" onClick={() => setDetalle(m.id)}>Ver</AccionButton>
                      <AccionButton
                        icono={deBaja ? RotateCcw : Trash2}
                        tono={deBaja ? "exito" : "peligro"}
                        disabled={cargando === m.id}
                        onClick={() => setModal({ mascota: m, baja: !deBaja })}
                      >
                        {deBaja ? "Reactivar" : "Dar de baja"}
                      </AccionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {detalle && <DetalleMascotaModal id={detalle} token={token} onCerrar={() => setDetalle(null)} />}

      {modal && (
        <MotivoModal
          titulo={`${modal.baja ? "Dar de baja a" : "Reactivar a"} ${modal.mascota.nombre}`}
          descripcion={
            modal.baja
              ? "También se dan de baja sus publicaciones activas y se notifica al dueño."
              : "Solo se reactiva la mascota: sus publicaciones se restauran una por una."
          }
          onCerrar={() => setModal(null)}
          onConfirmar={(motivo) =>
            ejecutar(
              modal.mascota.id,
              () => (modal.baja ? bajaMascota : reactivarMascota)(modal.mascota.id, motivo, token),
              modal.baja ? "Mascota dada de baja correctamente." : "Mascota reactivada correctamente.",
            ).then(() => setModal(null))
          }
        />
      )}
    </div>
  );
}
