"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Feedback } from "@/components/ui/Feedback";
import { obtenerRefugio, verificarRefugio } from "@/services/admin-usuarios";
import { ApiError } from "@/services/api";
import { PieVerificar, Resenas } from "@/components/admin/Detalle";
import { urlArchivo } from "@/services/api";
import type { DetalleRefugio } from "@/types/admin-usuarios";

// Modal de revisión previa a verificar un refugio (spec 002 §5) — datos + miembros + resumen.
export function DetalleRefugioModal({
  refugioId,
  token,
  onCerrar,
  onVerificado,
}: {
  refugioId: number;
  token: string;
  onCerrar: () => void;
  /** Con esto el modal es el de verificación: se revisa todo y se confirma al pie. */
  onVerificado?: () => void;
}) {
  const [detalle, setDetalle] = useState<DetalleRefugio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refugioIdCargado, setRefugioIdCargado] = useState(refugioId);

  if (refugioId !== refugioIdCargado) {
    setRefugioIdCargado(refugioId);
    setCargando(true);
    setDetalle(null);
    setError(null);
  }

  useEffect(() => {
    let cancelado = false;
    obtenerRefugio(refugioId, token)
      .then((data) => {
        if (!cancelado) setDetalle(data);
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar el refugio.",
          );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [refugioId, token]);

  return (
    <Modal
      titulo={onVerificado ? `Verificar: ${detalle?.refugio.nombre ?? "refugio"}` : (detalle?.refugio.nombre ?? "Detalle del refugio")}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
      pie={
        onVerificado && detalle ? (
          <PieVerificar
            onCerrar={onCerrar}
            onConfirmar={async () => {
              await verificarRefugio(refugioId, token);
              onVerificado();
            }}
          />
        ) : undefined
      }
    >
      {cargando && <p className="text-sm text-neutral-500">Cargando…</p>}
      {error && <Feedback tipo="error" mensaje={error} />}

      {detalle && (
        <div className="space-y-4 text-sm">
          <div className="flex gap-4">
            {detalle.refugio.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlArchivo(detalle.refugio.imagenUrl)} alt={detalle.refugio.nombre} className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">Sin logo</div>
            )}
          <div className="min-w-0 flex-1 space-y-1 text-neutral-700">
            <p>{detalle.refugio.direccion}</p>
            {detalle.refugio.telefono && <p>{detalle.refugio.telefono}</p>}
            {detalle.refugio.email && <p>{detalle.refugio.email}</p>}
            {detalle.refugio.descripcion && (
              <p className="text-neutral-500">{detalle.refugio.descripcion}</p>
            )}
          </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Resumen
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <ResumenItem
                etiqueta="Mascotas activas"
                valor={detalle.resumen.mascotasActivas}
              />
              <ResumenItem
                etiqueta="Publicaciones activas"
                valor={detalle.resumen.publicacionesActivas}
              />
              <ResumenItem
                etiqueta="Solicitudes pendientes"
                valor={detalle.resumen.solicitudesPendientes}
              />
              <ResumenItem
                etiqueta="Campañas activas"
                valor={detalle.resumen.campaniasActivas}
              />
              <ResumenItem
                etiqueta="Reseñas recibidas"
                valor={detalle.resumen.resenasRecibidas}
              />
              <ResumenItem
                etiqueta="Promedio reseñas"
                valor={detalle.resumen.promedioResenas}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Reseñas recibidas
            </h3>
            <Resenas r={detalle.resenas} />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Miembros
            </h3>
            {detalle.miembros.length === 0 && (
              <p className="text-neutral-500">Sin miembros asignados.</p>
            )}
            <ul className="space-y-1">
              {detalle.miembros.map((miembro) => (
                <li key={miembro.id} className="text-neutral-700">
                  {miembro.nombre} {miembro.apellido} — {miembro.email}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ResumenItem({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
      <p className="text-xs text-neutral-500">{etiqueta}</p>
      <p className="text-base font-semibold text-neutral-900">{valor}</p>
    </div>
  );
}
