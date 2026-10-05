"use client";

import { useState } from "react";
import { CircleCheck, Eye, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { MotivoModal } from "@/components/admin/MotivoModal";
import { AccionButton } from "@/components/ui/AccionButton";
import { Feedback } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { useTablaAdmin } from "@/lib/useTablaAdmin";
import {
  bajaPublicacion,
  cambiarEstadoPublicacion,
  reactivarPublicacion,
} from "@/services/admin-moderacion";
import { DetallePublicacionModal } from "./DetallePublicacionModal";
import type { AccionPublicacion, FiltrosModeracion, Lista, PublicacionAdmin } from "@/types/admin-moderacion";

const CAMPO = "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 sm:w-auto";

interface ModalMotivo {
  titulo: string;
  descripcion?: string;
  id: number;
  exito: string;
  accion: (motivo: string) => Promise<unknown>;
}

export function PublicacionesTabla({
  lista,
  filtros,
  token,
}: {
  lista: Lista<PublicacionAdmin>;
  filtros: FiltrosModeracion;
  token: string;
}) {
  const { cargando, error, exito, ejecutar, aplicarFiltros, irAPagina } = useTablaAdmin("/admin/publicaciones", filtros);
  const [modal, setModal] = useState<ModalMotivo | null>(null);
  const [detalle, setDetalle] = useState<number | null>(null);

  const cambiarEstado = (p: PublicacionAdmin, accion: AccionPublicacion, verbo: string, exito: string) =>
    setModal({
      titulo: `${verbo} «${p.titulo}»`,
      id: p.id,
      exito,
      accion: (motivo) => cambiarEstadoPublicacion(p.id, accion, motivo, token),
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="w-full text-xs font-medium text-neutral-600 sm:w-auto">
          <span className="mb-1 block">Buscar</span>
          <input
            type="text"
            maxLength={100}
            defaultValue={filtros.q ?? ""}
            placeholder="Título o mascota"
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
              {["Título", "Mascota", "Publica", "Estado", "Solicitudes", "Fecha", "Acciones"].map((c) => (
                <th key={c} className="px-4 py-3 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No hay publicaciones que coincidan con los filtros.
                </td>
              </tr>
            )}
            {lista.items.map((p) => {
              const deBaja = p.fechaBaja !== null;
              const ocupado = cargando === p.id;
              const estado = p.estado.nombre;
              return (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                  <td data-label="Título" className="px-4 py-3 text-center text-neutral-900">
                    <button type="button" onClick={() => setDetalle(p.id)} className="font-medium text-neutral-900 hover:underline">
                      {p.titulo}
                    </button>
                  </td>
                  <td data-label="Mascota" className="px-4 py-3 text-center text-neutral-600">{p.mascota.nombre} ({p.mascota.especie})</td>
                  <td data-label="Publica" className="px-4 py-3 text-center text-neutral-600">{p.publicador.nombre}</td>
                  <td data-label="Estado" className="px-4 py-3 text-center text-neutral-600">{deBaja ? "De baja" : estado}</td>
                  <td data-label="Solicitudes" className="px-4 py-3 text-center text-neutral-600">{p.cantidadSolicitudes}</td>
                  <td data-label="Fecha" className="px-4 py-3 text-center text-neutral-600">{new Date(p.fechaAlta).toLocaleDateString("es-AR")}</td>
                  <td data-label="Acciones" className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2 md:justify-center">
                      <AccionButton icono={Eye} tono="info" onClick={() => setDetalle(p.id)}>Ver</AccionButton>
                      {/* El backend valida la transición (409 TRANSICION_INVALIDA); acá solo se ofrece lo plausible. */}
                      {deBaja ? (
                        <AccionButton
                          icono={RotateCcw}
                          tono="exito"
                          disabled={ocupado}
                          onClick={() => ejecutar(p.id, () => reactivarPublicacion(p.id, token), "Publicación restaurada correctamente.")}
                        >
                          Restaurar
                        </AccionButton>
                      ) : (
                        <>
                          {estado === "Pausada" ? (
                            <AccionButton icono={Play} tono="exito" onClick={() => cambiarEstado(p, "REACTIVAR", "Reactivar", "Publicación reactivada correctamente.")}>
                              Reactivar
                            </AccionButton>
                          ) : (
                            <AccionButton icono={Pause} tono="info" onClick={() => cambiarEstado(p, "PAUSAR", "Pausar", "Publicación pausada correctamente.")}>
                              Pausar
                            </AccionButton>
                          )}
                          <AccionButton icono={CircleCheck} tono="neutral" onClick={() => cambiarEstado(p, "FINALIZAR", "Finalizar", "Publicación finalizada correctamente.")}>
                            Finalizar
                          </AccionButton>
                          <AccionButton
                            icono={Trash2}
                            tono="peligro"
                            onClick={() =>
                              setModal({
                                titulo: `Dar de baja «${p.titulo}»`,
                                descripcion: "Se notifica al dueño con el motivo.",
                                id: p.id,
                                exito: "Publicación dada de baja correctamente.",
                                accion: (motivo) => bajaPublicacion(p.id, motivo, token),
                              })
                            }
                          >
                            Dar de baja
                          </AccionButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {detalle && <DetallePublicacionModal id={detalle} token={token} onCerrar={() => setDetalle(null)} />}

      {modal && (
        <MotivoModal
          titulo={modal.titulo}
          descripcion={modal.descripcion}
          onCerrar={() => setModal(null)}
          onConfirmar={(motivo) => ejecutar(modal.id, () => modal.accion(motivo), modal.exito).then(() => setModal(null))}
        />
      )}
    </div>
  );
}
