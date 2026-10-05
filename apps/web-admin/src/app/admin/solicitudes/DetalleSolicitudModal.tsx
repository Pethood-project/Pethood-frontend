"use client";

import { Dato, DetalleModal, Seccion, diaHora, dia } from "@/components/admin/Detalle";
import { obtenerSolicitud } from "@/services/admin-moderacion";

export function DetalleSolicitudModal({ id, token, onCerrar }: { id: number; token: string; onCerrar: () => void }) {
  return (
    <DetalleModal titulo="Detalle de la solicitud" clave={`${id}:${token}`} pedir={() => obtenerSolicitud(id, token)} onCerrar={onCerrar}>
      {(s) => (
        <>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            <Dato k="Mascota" v={s.mascota.nombre} />
            <Dato k="Solicitante" v={s.solicitante.nombre} />
            <Dato k="Refugio" v={s.refugio?.nombre} />
            <Dato k="Tipo" v={s.tipo} />
            <Dato k="Estado" v={s.estado?.nombre} />
            <Dato k="Creada" v={diaHora(s.fechaAlta)} />
            <Dato k="Respuesta" v={s.fechaRespuesta ? diaHora(s.fechaRespuesta) : null} />
            <Dato k="Tránsito" v={s.fechaInicioTransito ? `${dia(s.fechaInicioTransito)} – ${s.fechaFinTransito ? dia(s.fechaFinTransito) : "…"}` : null} />
          </dl>
          {s.motivacion && <Seccion titulo="Motivación"><p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-2">{s.motivacion}</p></Seccion>}
          {s.comentario && <Seccion titulo="Comentario"><p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-2">{s.comentario}</p></Seccion>}
          <Seccion titulo="Historial de estados">
            <ol className="space-y-1">
              {s.historialEstados.map((h, i) => (
                <li key={i} className="flex justify-between rounded-md bg-neutral-50 px-2 py-1">
                  <span className="text-neutral-900">{h.estado}</span>
                  <span className="text-xs text-neutral-500">{diaHora(h.fechaAlta)}</span>
                </li>
              ))}
            </ol>
          </Seccion>
        </>
      )}
    </DetalleModal>
  );
}
