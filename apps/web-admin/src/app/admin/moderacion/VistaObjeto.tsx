"use client";

import { useEffect, useState } from "react";
import { Chips, Dato, Galeria, dia, plata, siNo } from "@/components/admin/Detalle";
import { EstadoBadge, type EstadoCiclo } from "@/components/ui/EstadoBadge";
import { urlArchivo } from "@/services/api";
import { obtenerPublicacion } from "@/services/admin-moderacion";
import { obtenerRefugio } from "@/services/admin-usuarios";
import type { DetallePublicacionAdmin } from "@/types/admin-moderacion";
import type { DetalleRefugio } from "@/types/admin-usuarios";
import type { TipoReporte, VistaObjetoReporte } from "@/types/admin-reportes";

export function edad(iso: string | null): string | null {
  if (!iso) return null;
  const meses = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (30.44 * 86_400_000)));
  return meses < 12 ? `${meses} ${meses === 1 ? "mes" : "meses"}` : `${Math.floor(meses / 12)} años`;
}

export function Publicacion({ p }: { p: DetallePublicacionAdmin }) {
  const m = p.mascota;
  const fotos = p.imagenes.length ? p.imagenes : m.imagenUrl ? [m.imagenUrl] : [];
  return (
    <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
      <Galeria fotos={fotos} alt={p.titulo} />
      <div className="space-y-3">
        <div>
          <p className="font-heading text-lg text-neutral-900">{p.titulo}</p>
          <p className="text-sm text-neutral-600">
            {p.estado.nombre} · publica {p.publicador.nombre} ({p.publicador.tipo === "REFUGIO" ? "refugio" : "adoptante"})
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          <Dato k="Mascota" v={m.nombre} />
          <Dato k="Especie / raza" v={`${m.especie} · ${m.raza}`} />
          <Dato k="Edad" v={edad(m.fechaNacimiento)} />
          <Dato k="Género" v={m.genero} />
          <Dato k="Tamaño" v={m.tamanio} />
          <Dato k="Castrado" v={siNo(m.castrado)} />
          <Dato k="Desparasitado" v={siNo(p.desparasitado)} />
          <Dato k="Ubicación" v={p.ubicacion} />
        </dl>
        {p.descripcion && <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-2 text-sm text-neutral-700">{p.descripcion}</p>}
        {p.personalidad.length > 0 && <Chips items={p.personalidad} />}
        {p.requisitos.length > 0 && <Chips items={p.requisitos} />}
        <p className="text-xs text-neutral-500">
          {p.reportes.length} reporte(s) en total, {p.reportes.filter((r) => !r.resuelto).length} pendiente(s) · {p.cantidadSolicitudes} solicitud(es)
        </p>
      </div>
    </div>
  );
}

function Refugio({ d }: { d: DetalleRefugio }) {
  const { refugio: r, resumen: s } = d;
  return (
    <div className="flex gap-4">
      {r.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlArchivo(r.imagenUrl)} alt={r.nombre} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">Sin logo</div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-lg text-neutral-900">{r.nombre}</p>
          <EstadoBadge estado={r.estado as EstadoCiclo} />
          {r.verificado && <span className="text-xs text-green-700">Verificado</span>}
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          <Dato k="Dirección" v={r.direccion} />
          <Dato k="Teléfono" v={r.telefono} />
          <Dato k="Email" v={r.email} />
          <Dato k="Miembros" v={String(d.miembros.length)} />
          <Dato k="Mascotas activas" v={String(s.mascotasActivas)} />
          <Dato k="Reseñas" v={s.resenasRecibidas ? `${s.promedioResenas.toFixed(1)} (${s.resenasRecibidas})` : "Sin reseñas"} />
        </dl>
        {r.descripcion && <p className="text-sm text-neutral-700">{r.descripcion}</p>}
      </div>
    </div>
  );
}


/** Misma tarjeta (foto + datos) para persona, reseña, aviso y campaña. */
function Generica({ v }: { v: VistaObjetoReporte }) {
  let fotos: string[] = [];
  let titulo = "";
  let datos: [string, string | null][] = [];
  let texto: string | null = null;

  if (v.tipo === "USUARIO") {
    fotos = v.imagenUrl ? [v.imagenUrl] : [];
    titulo = `${v.nombre} ${v.apellido}`;
    datos = [["Email", v.email], ["Teléfono", v.telefono], ["Estado", v.estado], ["Verificado", v.verificado ? "Sí" : "No"],
      ["Zona", [v.localidad, v.provincia].filter(Boolean).join(", ")], ["Alta", dia(v.fechaAlta)],
      ["Refugios", v.refugios.map((r) => r.nombre).join(", ")]];
  } else if (v.tipo === "RESENA") {
    titulo = `${"★".repeat(v.puntuacion)}${"☆".repeat(5 - v.puntuacion)}`;
    datos = [["Autor", `${v.autor.nombre} ${v.autor.apellido}`], ["Sobre", v.receptor.nombre], ["Fecha", dia(v.fecha)]];
    texto = v.comentario;
  } else if (v.tipo === "ANIMAL_PERDIDO") {
    fotos = v.imagenes;
    titulo = v.nombre ?? "Sin nombre";
    datos = [["Estado", v.estado], ["Ubicación", v.ubicacion], ["Fecha", dia(v.fechaSuceso)], ["Publicó", `${v.reportante.nombre} ${v.reportante.apellido}`]];
    texto = v.descripcion;
  } else {
    fotos = v.imagenes;
    titulo = v.titulo;
    datos = [["Estado", v.estado], ["Refugio", v.refugio.nombre], ["Recaudado", `${plata(v.montoActual)} de ${plata(v.montoObjetivo)}`], ["Período", `${dia(v.fechaInicio)} – ${dia(v.fechaFin)}`]];
    texto = v.descripcion;
  }

  return (
    <div className={`grid gap-4 ${fotos.length ? "sm:grid-cols-[12rem_1fr]" : ""}`}>
      {fotos.length > 0 && <Galeria fotos={fotos} alt={titulo} />}
      <div className="space-y-3">
        <p className="font-heading text-lg text-neutral-900">{titulo}</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {datos.map(([k, val]) => <Dato key={k} k={k} v={val} />)}
        </dl>
        {texto && <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-2 text-sm text-neutral-700">{texto}</p>}
      </div>
    </div>
  );
}

// Persona, reseña, aviso y campaña vienen en `objeto.vista`; publicación y refugio se traen de
// sus endpoints de admin (spec 008 §4).
export function VistaObjeto({ tipo, objetoId, vista, token }: { tipo: TipoReporte; objetoId: number; vista?: VistaObjetoReporte; token: string }) {
  const [publicacion, setPublicacion] = useState<DetallePublicacionAdmin | null>(null);
  const [refugio, setRefugio] = useState<DetalleRefugio | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const carga =
      tipo === "PUBLICACION"
        ? obtenerPublicacion(objetoId, token).then(setPublicacion)
        : tipo === "REFUGIO"
          ? obtenerRefugio(objetoId, token).then(setRefugio)
          : null;
    carga?.catch(() => setFallo(true));
  }, [tipo, objetoId, token]);

  if (vista) return <div className="rounded-xl border border-neutral-200 p-4"><Generica v={vista} /></div>;
  if (tipo === "MENSAJE") return null;
  if (tipo !== "PUBLICACION" && tipo !== "REFUGIO") {
    return <p className="text-sm text-neutral-500">Todavía no hay más detalle de este tipo de objeto.</p>;
  }
  if (fallo) return <p className="text-sm text-neutral-500">No pudimos cargar el detalle del objeto reportado.</p>;
  if (!publicacion && !refugio) return <p className="text-sm text-neutral-500">Cargando objeto…</p>;

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      {publicacion && <Publicacion p={publicacion} />}
      {refugio && <Refugio d={refugio} />}
    </div>
  );
}
