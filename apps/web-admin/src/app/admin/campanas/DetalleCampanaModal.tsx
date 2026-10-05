"use client";

import { Dato, DetalleModal, Galeria, dia, plata } from "@/components/admin/Detalle";
import { obtenerCampana } from "@/services/admin-campanas";

export function DetalleCampanaModal({ id, token, onCerrar }: { id: number; token: string; onCerrar: () => void }) {
  return (
    <DetalleModal titulo="Detalle de la campaña" clave={`${id}:${token}`} pedir={() => obtenerCampana(id, token)} onCerrar={onCerrar}>
      {(c) => (
        <div className={`grid gap-4 ${c.imagenUrl ? "sm:grid-cols-[12rem_1fr]" : ""}`}>
          {c.imagenUrl && <Galeria fotos={[c.imagenUrl]} alt={c.titulo} />}
          <div className="space-y-3">
            <p className="font-heading text-lg text-neutral-900">{c.titulo}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Dato k="Estado" v={c.estado.nombre} />
              <Dato k="Refugio" v={c.refugio.nombre} />
              <Dato k="Objetivo" v={plata(c.objetivo)} />
              <Dato k="Período" v={`${dia(c.fechaInicio)} – ${dia(c.fechaFin)}`} />
              <Dato k="Donaciones" v={String(c.donaciones.cantidad)} />
              <Dato k="Monto declarado" v={plata(c.donaciones.montoDeclarado)} />
            </dl>
            <p className="text-xs text-neutral-500">El monto declarado no es lo recaudado: cuenta cuando el refugio confirma cada donación.</p>
            {c.descripcion && <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-2 text-sm text-neutral-700">{c.descripcion}</p>}
          </div>
        </div>
      )}
    </DetalleModal>
  );
}
