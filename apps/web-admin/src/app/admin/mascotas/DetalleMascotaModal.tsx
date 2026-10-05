"use client";

import { Dato, DetalleModal, Galeria, Seccion, dia, siNo } from "@/components/admin/Detalle";
import { edad } from "@/app/admin/moderacion/VistaObjeto";
import { obtenerMascota } from "@/services/admin-moderacion";
import { urlArchivo } from "@/services/api";

export function DetalleMascotaModal({ id, token, onCerrar }: { id: number; token: string; onCerrar: () => void }) {
  return (
    <DetalleModal titulo="Detalle de la mascota" clave={`${id}:${token}`} pedir={() => obtenerMascota(id, token)} onCerrar={onCerrar}>
      {(m) => (
        <>
          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <Galeria fotos={m.imagenUrl ? [m.imagenUrl] : []} alt={m.nombre} />
            <div className="space-y-3">
              <div>
                <p className="font-heading text-lg text-neutral-900">{m.nombre}</p>
                <p className="text-sm text-neutral-600">
                  {m.fechaBaja ? "De baja" : (m.estado?.nombre ?? "—")} · {m.duenio.tipo === "REFUGIO" ? "refugio" : "adoptante"} {m.duenio.nombre}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                <Dato k="Especie / raza" v={m.raza ? `${m.especie} · ${m.raza}` : m.especie} />
                <Dato k="Edad" v={m.fechaNacimiento ? edad(m.fechaNacimiento) : null} />
                <Dato k="Género" v={m.genero} />
                <Dato k="Tamaño" v={m.tamanio} />
                <Dato k="Peso" v={m.peso === null ? null : `${m.peso} kg`} />
                <Dato k="Castrado" v={siNo(m.castrado)} />
                <Dato k="Publicada" v={m.tienePublicacionActiva ? "Sí" : "No"} />
                <Dato k="Alta" v={dia(m.fechaAlta)} />
              </dl>
              {m.descripcion && <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-2 text-sm text-neutral-700">{m.descripcion}</p>}
            </div>
          </div>
          <Seccion titulo="Historia clínica (solo lectura)">
            {m.historiaClinica.length === 0 ? (
              <p className="text-neutral-500">Sin registros.</p>
            ) : (
              <ul className="space-y-2">
                {m.historiaClinica.map((h) => (
                  <li key={h.id} className="rounded-md bg-neutral-50 p-2">
                    <p className="text-neutral-900">
                      {h.titulo} <span className="text-xs text-neutral-500">· {dia(h.fechaVisita)}</span>
                      {h.vacunacion && <span className="ml-2 text-xs text-green-700">Vacuna{h.tipoVacuna ? `: ${h.tipoVacuna}` : ""}</span>}
                    </p>
                    {h.descripcion && <p className="whitespace-pre-wrap">{h.descripcion}</p>}
                    {h.documentoUrl && (
                      <a href={urlArchivo(h.documentoUrl)} target="_blank" rel="noreferrer" className="text-xs text-pethood-orange-dark underline">
                        Ver documento
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
        </>
      )}
    </DetalleModal>
  );
}
