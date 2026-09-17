"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Feedback } from "@/components/ui/Feedback";
import { obtenerRefugio } from "@/services/admin-usuarios";
import { ApiError } from "@/services/api";
import type { DetalleRefugio } from "@/types/admin-usuarios";

// Modal de revisión previa a verificar un refugio (spec 002 §5) — datos + miembros + resumen.
export function DetalleRefugioModal({
  refugioId,
  token,
  onCerrar,
}: {
  refugioId: number;
  token: string;
  onCerrar: () => void;
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
      titulo={detalle?.refugio.nombre ?? "Detalle del refugio"}
      onCerrar={onCerrar}
    >
      {cargando && <p className="text-sm text-neutral-500">Cargando…</p>}
      {error && <Feedback tipo="error" mensaje={error} />}

      {detalle && (
        <div className="space-y-4 text-sm">
          <div className="space-y-1 text-neutral-700">
            <p>{detalle.refugio.direccion}</p>
            {detalle.refugio.telefono && <p>{detalle.refugio.telefono}</p>}
            {detalle.refugio.email && <p>{detalle.refugio.email}</p>}
            {detalle.refugio.descripcion && (
              <p className="text-neutral-500">{detalle.refugio.descripcion}</p>
            )}
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
