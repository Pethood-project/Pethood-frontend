"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck, Eye, Trash2 } from "lucide-react";
import { AccionButton } from "@/components/ui/AccionButton";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/services/api";
import { bajaConsulta, resolverConsulta } from "@/services/soporte";
import type { Consulta } from "@/types/soporte";

const fecha = (iso: string) => new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

export function ConsultasTabla({
  consultas,
  filtro,
  token,
}: {
  consultas: Consulta[];
  filtro: string;
  token: string;
}) {
  const router = useRouter();
  const [detalle, setDetalle] = useState<Consulta | null>(null);
  const [aBorrar, setABorrar] = useState<Consulta | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function ejecutar(accion: () => Promise<unknown>, mensajeExito: string) {
    setCargando(true);
    setError(null);
    setExito(null);
    try {
      await accion();
      setExito(mensajeExito);
      setDetalle(null);
      setABorrar(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
      setDetalle(null);
      setABorrar(null);
    } finally {
      setCargando(false);
    }
  }

  const resolver = (c: Consulta) =>
    ejecutar(() => resolverConsulta(c.id, token), "Consulta marcada como resuelta.");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-neutral-600">Estado</label>
        <select
          defaultValue={filtro}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
          onChange={(e) => router.push(e.target.value ? `/admin/consultas?resuelta=${e.target.value}` : "/admin/consultas")}
        >
          <option value="">Todas</option>
          <option value="false">Pendientes</option>
          <option value="true">Resueltas</option>
        </select>
      </div>

      {error && <Feedback tipo="error" mensaje={error} />}
      {exito && <Feedback tipo="exito" mensaje={exito} />}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-center">Nombre</th>
              <th className="px-4 py-3 text-center">Email</th>
              <th className="px-4 py-3 text-center">Asunto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {consultas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No hay consultas para mostrar.
                </td>
              </tr>
            )}
            {consultas.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-center text-neutral-600">{fecha(c.fechaAlta)}</td>
                <td className="px-4 py-3 text-center text-neutral-900">{c.nombreCompleto}</td>
                <td className="px-4 py-3 text-center text-neutral-600">{c.email}</td>
                <td className="px-4 py-3 text-center text-neutral-900">{c.asunto}</td>
                <td className="px-4 py-3 text-center text-neutral-600">{c.resuelta ? "Resuelta" : "Pendiente"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-center gap-2">
                    <AccionButton icono={Eye} tono="info" onClick={() => setDetalle(c)}>
                      Ver
                    </AccionButton>
                    {!c.resuelta && (
                      <AccionButton icono={CheckCheck} tono="exito" disabled={cargando} onClick={() => resolver(c)}>
                        Resolver
                      </AccionButton>
                    )}
                    <AccionButton icono={Trash2} tono="peligro" onClick={() => setABorrar(c)}>
                      Dar de baja
                    </AccionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalle && (
        <Modal titulo={detalle.asunto} onCerrar={() => setDetalle(null)}>
          <div className="space-y-3 text-sm text-neutral-700">
            <p>
              <span className="font-medium">{detalle.nombreCompleto}</span> ·{" "}
              <a className="text-blue-700 underline" href={`mailto:${detalle.email}`}>
                {detalle.email}
              </a>{" "}
              · {fecha(detalle.fechaAlta)}
            </p>
            {/* Texto plano: React lo escapa, whitespace-pre-wrap respeta los saltos de línea. */}
            <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3">{detalle.mensaje}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDetalle(null)}>
                Cerrar
              </Button>
              {!detalle.resuelta && (
                <Button disabled={cargando} onClick={() => resolver(detalle)}>
                  Marcar como resuelta
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {aBorrar && (
        <Modal titulo="Dar de baja la consulta" onCerrar={() => setABorrar(null)}>
          <p className="mb-4 text-sm text-neutral-700">
            La consulta &quot;{aBorrar.asunto}&quot; deja de mostrarse. ¿Confirmás?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setABorrar(null)}>
              Cancelar
            </Button>
            <Button disabled={cargando} onClick={() => ejecutar(() => bajaConsulta(aBorrar.id, token), "Consulta dada de baja.")}>
              Confirmar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
