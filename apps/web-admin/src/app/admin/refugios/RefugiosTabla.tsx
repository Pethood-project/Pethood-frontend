"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, RotateCcw, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Pagination } from "@/components/ui/Pagination";
import { AccionButton } from "@/components/ui/AccionButton";
import { MotivoModal } from "@/components/admin/MotivoModal";
import {
  bajaRefugio,
  reactivarRefugio,
  suspenderRefugio,
  verificarRefugio,
} from "@/services/admin-usuarios";
import { ApiError } from "@/services/api";
import type { FiltrosRefugios, ListaRefugios, RefugioAdmin } from "@/types/admin-usuarios";
import { AltaRefugioModal } from "./AltaRefugioModal";
import { DetalleRefugioModal } from "./DetalleRefugioModal";

export function RefugiosTabla({
  lista,
  filtros,
  token,
}: {
  lista: ListaRefugios;
  filtros: FiltrosRefugios;
  token: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [modalAlta, setModalAlta] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<number | null>(null);
  const [modalSuspender, setModalSuspender] = useState<RefugioAdmin | null>(null);
  const [modalBaja, setModalBaja] = useState<RefugioAdmin | null>(null);

  function aplicarFiltros(nuevos: Partial<FiltrosRefugios>) {
    const params = new URLSearchParams();
    const combinados = { ...filtros, ...nuevos, page: 1 };
    for (const [clave, valor] of Object.entries(combinados)) {
      if (valor) params.set(clave, String(valor));
    }
    router.push(`/admin/refugios?${params.toString()}`);
  }

  function irAPagina(page: number) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries({ ...filtros, page })) {
      if (valor) params.set(clave, String(valor));
    }
    router.push(`/admin/refugios?${params.toString()}`);
  }

  async function ejecutar(id: number, accion: () => Promise<unknown>, mensajeExito: string) {
    setCargando(id);
    setError(null);
    setExito(null);
    try {
      await accion();
      setExito(mensajeExito);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Buscar</label>
            <input
              type="text"
              defaultValue={filtros.q ?? ""}
              placeholder="Nombre del refugio"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
              onKeyDown={(e) => {
                if (e.key === "Enter") aplicarFiltros({ q: e.currentTarget.value });
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Estado</label>
            <select
              defaultValue={filtros.estado ?? ""}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
              onChange={(e) =>
                aplicarFiltros({ estado: (e.target.value || undefined) as FiltrosRefugios["estado"] })
              }
            >
              <option value="">Todos</option>
              <option value="Pendiente_Verificacion">Pendiente de verificación</option>
              <option value="Activo">Activo</option>
              <option value="Suspendido">Suspendido</option>
              <option value="Inactivo">Dado de baja</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Verificado</label>
            <select
              defaultValue={filtros.verificado ?? ""}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
              onChange={(e) =>
                aplicarFiltros({ verificado: (e.target.value || undefined) as FiltrosRefugios["verificado"] })
              }
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <Button onClick={() => setModalAlta(true)}>Nuevo refugio</Button>
      </div>

      {error && <Feedback tipo="error" mensaje={error} />}
      {exito && <Feedback tipo="exito" mensaje={exito} />}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-center">Nombre</th>
              <th className="px-4 py-3 text-center">Contacto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Verificado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.refugios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No hay refugios que coincidan con los filtros.
                </td>
              </tr>
            )}
            {lista.refugios.map((refugio) => (
              <tr key={refugio.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => setModalDetalle(refugio.id)}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {refugio.nombre}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-neutral-600">{refugio.email ?? refugio.telefono ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <EstadoBadge estado={refugio.estado} />
                </td>
                <td className="px-4 py-3 text-center text-neutral-600">{refugio.verificado ? "Sí" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-center gap-2">
                    {refugio.estado === "Pendiente_Verificacion" && (
                      <AccionButton
                        icono={BadgeCheck}
                        tono="exito"
                        disabled={cargando === refugio.id}
                        onClick={() =>
                          ejecutar(
                            refugio.id,
                            () => verificarRefugio(refugio.id, token),
                            "Refugio verificado correctamente.",
                          )
                        }
                      >
                        Verificar
                      </AccionButton>
                    )}
                    {refugio.estado === "Activo" && (
                      <AccionButton icono={ShieldOff} tono="peligro" onClick={() => setModalSuspender(refugio)}>
                        Suspender
                      </AccionButton>
                    )}
                    {refugio.estado === "Suspendido" && (
                      <AccionButton
                        icono={RotateCcw}
                        tono="exito"
                        disabled={cargando === refugio.id}
                        onClick={() =>
                          ejecutar(
                            refugio.id,
                            () => reactivarRefugio(refugio.id, token),
                            "Refugio reactivado correctamente.",
                          )
                        }
                      >
                        Reactivar
                      </AccionButton>
                    )}
                    {refugio.estado !== "Inactivo" && (
                      <AccionButton icono={Trash2} tono="peligro" onClick={() => setModalBaja(refugio)}>
                        Dar de baja
                      </AccionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {modalAlta && (
        <AltaRefugioModal
          token={token}
          onCerrar={() => setModalAlta(false)}
          onCreado={() => {
            setModalAlta(false);
            setExito("Refugio creado correctamente.");
            router.refresh();
          }}
        />
      )}

      {modalDetalle !== null && (
        <DetalleRefugioModal refugioId={modalDetalle} token={token} onCerrar={() => setModalDetalle(null)} />
      )}

      {modalSuspender && (
        <MotivoModal
          titulo={`Suspender ${modalSuspender.nombre}`}
          onCerrar={() => setModalSuspender(null)}
          onConfirmar={(motivo) =>
            ejecutar(
              modalSuspender.id,
              () => suspenderRefugio(modalSuspender.id, motivo, token),
              "Refugio suspendido correctamente.",
            ).then(() => setModalSuspender(null))
          }
        />
      )}

      {modalBaja && (
        <MotivoModal
          titulo={`Dar de baja a ${modalBaja.nombre}`}
          descripcion="Esta acción no tiene reversión por API."
          onCerrar={() => setModalBaja(null)}
          onConfirmar={(motivo) =>
            ejecutar(
              modalBaja.id,
              () => bajaRefugio(modalBaja.id, motivo, token),
              "Refugio dado de baja correctamente.",
            ).then(() => setModalBaja(null))
          }
        />
      )}
    </div>
  );
}
