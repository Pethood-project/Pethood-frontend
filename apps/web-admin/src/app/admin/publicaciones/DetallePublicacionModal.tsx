"use client";

import { DetalleModal, Seccion, diaHora } from "@/components/admin/Detalle";
import { Publicacion } from "@/app/admin/moderacion/VistaObjeto";
import { obtenerPublicacion } from "@/services/admin-moderacion";

export function DetallePublicacionModal({ id, token, onCerrar }: { id: number; token: string; onCerrar: () => void }) {
  return (
    <DetalleModal titulo="Detalle de la publicación" clave={`${id}:${token}`} pedir={() => obtenerPublicacion(id, token)} onCerrar={onCerrar}>
      {(p) => (
        <>
          <Publicacion p={p} />
          {p.reportes.length > 0 && (
            <Seccion titulo="Reportes">
              <ul className="space-y-1">
                {p.reportes.map((r) => (
                  <li key={r.id} className="rounded-md bg-neutral-50 p-2">
                    <p className="text-xs text-neutral-500">
                      {r.reportante ? `${r.reportante.nombre} ${r.reportante.apellido}` : "—"} · {diaHora(r.fechaAlta)} · {r.resuelto ? "Resuelto" : "Pendiente"}
                    </p>
                    <p className="whitespace-pre-wrap">{r.motivo}</p>
                  </li>
                ))}
              </ul>
            </Seccion>
          )}
        </>
      )}
    </DetalleModal>
  );
}
