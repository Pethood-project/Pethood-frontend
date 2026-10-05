"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { LIMITES, validarTexto } from "@/lib/validation";
import { ApiError, urlArchivo } from "@/services/api";
import { obtenerReporte, resolverReporte } from "@/services/admin-reportes";
import type { DetalleReporte, EstadoObjeto } from "@/types/admin-reportes";
import { TIPOS } from "./ReportesTabla";
import { AccionesObjeto } from "./AccionesObjeto";
import { VistaObjeto } from "./VistaObjeto";

const ES_VIDEO = /\.(mp4|mov|webm)$/i;

const ESTADOS_OBJETO: Record<EstadoObjeto, string> = {
  ACTIVO: "Activo",
  SUSPENDIDO: "Suspendido",
  DE_BAJA: "Dado de baja",
};

const fecha = (iso: string) => new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
const persona = (p: { nombre: string; apellido: string } | null) => (p ? `${p.nombre} ${p.apellido}` : "—");

// HU-3.6 detalle + HU-3.7 resolver. Resolver NO actúa sobre el objeto: suspender o dar de baja
// se hace aparte (HU-3.4 / 3.5), por eso se muestra su estado actual.
export function DetalleReporteModal({
  id,
  token,
  onCerrar,
  onCambio,
}: {
  id: number;
  token: string;
  onCerrar: () => void;
  /** Algo cambió (se resolvió el reporte o se actuó sobre el objeto): la tabla se refresca. */
  onCambio: (mensaje: string) => unknown;
}) {
  const [reporte, setReporte] = useState<DetalleReporte | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(
    () =>
      obtenerReporte(id, token)
        .then(setReporte)
        .catch((err) => setError(err instanceof ApiError ? err.message : "No pudimos cargar el reporte. Intentá de nuevo.")),
    [id, token],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const errorRespuesta = validarTexto(respuesta, { etiqueta: "La respuesta", ...LIMITES.respuestaReporte });

  async function resolver() {
    setIntentado(true);
    if (errorRespuesta) return;
    setEnviando(true);
    setError(null);
    try {
      await resolverReporte(id, respuesta.trim(), token);
      await onCambio("Reporte resuelto. El reportante recibió tu respuesta.");
      onCerrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos resolver el reporte. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={reporte ? `Reporte de ${TIPOS[reporte.tipo].toLowerCase()}` : "Reporte"} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="space-y-4 text-sm text-neutral-700">
        {error && <Feedback tipo="error" mensaje={error} />}
        {!reporte && !error && <p className="text-neutral-500">Cargando…</p>}

        {reporte && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs">{TIPOS[reporte.tipo]}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs ${reporte.resuelto ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                {reporte.resuelto ? "Resuelto" : "Pendiente"}
              </span>
              {reporte.objeto.estado && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${reporte.objeto.estado === "ACTIVO" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                  Objeto: {ESTADOS_OBJETO[reporte.objeto.estado]}
                </span>
              )}
              <span className="text-xs text-neutral-500">
                {reporte.objeto.etiqueta ?? `#${reporte.objeto.id}`}
              </span>
              {reporte.objeto.reportesTotales > 1 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                  Reportado {reporte.objeto.reportesTotales} veces · {reporte.objeto.reportesPendientes} pendiente(s)
                </span>
              )}
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase text-red-700">
                Motivo · {persona(reporte.reportante)} · {fecha(reporte.fechaAlta)}
              </p>
              <p className="whitespace-pre-wrap text-neutral-900">{reporte.motivo}</p>
            </div>

            <VistaObjeto tipo={reporte.tipo} objetoId={reporte.objeto.id} vista={reporte.objeto.vista} token={token} />

            {reporte.objeto.contexto && (
              <div>
                <p className="mb-1 font-medium">Conversación (mensajes cercanos)</p>
                <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md bg-neutral-50 p-2">
                  {reporte.objeto.contexto.map((m) => (
                    <li
                      key={m.id}
                      className={`rounded-md px-2 py-1 ${m.id === reporte.objeto.id ? "border border-red-200 bg-red-50" : ""}`}
                    >
                      <span className="text-xs text-neutral-500">
                        {persona(m.usuario)} · {fecha(m.fechaAlta)}
                      </span>
                      <p className="whitespace-pre-wrap">{m.contenido || "(sin texto)"}</p>
                      {m.imagenes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {m.imagenes.map((a) =>
                            ES_VIDEO.test(a) ? (
                              <video key={a} src={urlArchivo(a)} controls className="h-24 rounded-md" />
                            ) : (
                              <a key={a} href={urlArchivo(a)} target="_blank" rel="noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={urlArchivo(a)} alt="Adjunto del mensaje" className="h-24 rounded-md object-cover" />
                              </a>
                            ),
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <AccionesObjeto
              reporte={reporte}
              token={token}
              onHecho={async (mensaje) => {
                await cargar();
                await onCambio(mensaje);
              }}
            />

            {reporte.resuelto ? (
              <div>
                <p className="mb-1 font-medium">
                  Resuelto por {persona(reporte.resueltoPor)}
                  {reporte.fechaResolucion && ` · ${fecha(reporte.fechaResolucion)}`}
                </p>
                <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3">{reporte.respuesta}</p>
              </div>
            ) : (
              <div>
                <label htmlFor="respuesta" className="mb-1 block font-medium">
                  Respuesta al reportante
                </label>
                <textarea
                  id="respuesta"
                  rows={3}
                  maxLength={LIMITES.respuestaReporte.max}
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                  placeholder="Contale qué decidiste. Le llega como notificación."
                />
                <p className="mt-1 flex justify-between text-xs text-neutral-400">
                  <span className="text-red-700">{intentado && errorRespuesta}</span>
                  <span>{respuesta.length}/{LIMITES.respuestaReporte.max}</span>
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
                Cerrar
              </Button>
              {!reporte.resuelto && (
                <Button onClick={resolver} disabled={enviando}>
                  {enviando ? "Resolviendo…" : "Resolver reporte"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
