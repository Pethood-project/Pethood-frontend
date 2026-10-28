import { BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import { cookies } from "next/headers";

import { EditarPerfilRefugio } from "@/components/refugio/EditarPerfilRefugio";
import { Card } from "@/components/ui/Card";
import { AUTH_COOKIE } from "@/lib/auth";
import { dia } from "@/lib/formato";
import { urlArchivo } from "@/services/api";
import { listarResenasRefugio, obtenerPerfilPublicoRefugio, obtenerPerfilRefugio } from "@/services/refugio";

function Estrellas({ n }: { n: number }) {
  return (
    <span className="text-amber-500" aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(n)}
      <span className="text-neutral-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number | string }) {
  return (
    <div className="rounded-xl border border-neutral-300 bg-white/60 p-3">
      <p className="text-sm text-neutral-600">{etiqueta}</p>
      <p className="font-heading text-2xl text-neutral-900">{valor}</p>
    </div>
  );
}

// GUI-26 — lo que ven los adoptantes del refugio: datos públicos (spec 023), estadísticas
// (spec 017) y reseñas adoptante→refugio (Módulo 10). «Editar datos» usa PATCH /refugio/perfil.
export default async function PerfilRefugioPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const perfil = await obtenerPerfilRefugio(token);
  const [publico, resenas] = await Promise.all([
    obtenerPerfilPublicoRefugio(perfil.id, token),
    listarResenasRefugio(perfil.id, token),
  ]);

  const ubicacion = [perfil.calleAltura, perfil.localidad, perfil.provincia].filter(Boolean).join(", ");
  const maximoDistribucion = Math.max(1, ...resenas.distribucion.map((d) => d.cantidad));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">Perfil público</h1>
          <p className="text-base text-neutral-700">Así ven los adoptantes a tu refugio.</p>
        </div>
        <EditarPerfilRefugio perfil={perfil} token={token} />
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {perfil.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlArchivo(perfil.imagenUrl)} alt={perfil.nombre} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-neutral-200 font-heading text-3xl text-neutral-500">
              {perfil.nombre.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl text-neutral-900">{perfil.nombre}</h2>
              {perfil.verificado && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-sm text-green-700">
                  <BadgeCheck className="h-4 w-4" /> Verificado
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600">En PetHood desde el {dia(publico.fechaAlta)}</p>
            {perfil.descripcion && <p className="whitespace-pre-wrap text-base text-neutral-800">{perfil.descripcion}</p>}
            <ul className="space-y-1 text-sm text-neutral-700">
              {ubicacion && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {perfil.mapaUrl ? (
                    <a href={perfil.mapaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900">
                      {ubicacion}
                    </a>
                  ) : (
                    ubicacion
                  )}
                </li>
              )}
              {perfil.telefono && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" /> {perfil.telefono}
                </li>
              )}
              {perfil.email && (
                <li className="flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 shrink-0" /> {perfil.email}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metrica etiqueta="En el refugio" valor={perfil.estadisticas.enRefugio} />
          <Metrica etiqueta="Adopciones" valor={perfil.estadisticas.adopciones} />
          <Metrica etiqueta="Publicaciones activas" valor={publico.resumen.publicacionesActivas} />
          <Metrica
            etiqueta="Valoración"
            valor={resenas.promedio === null ? "—" : `${resenas.promedio.toFixed(1)} ★`}
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl text-neutral-900">Reseñas</h2>
        {resenas.cantidad === 0 ? (
          <p className="mt-2 text-base text-neutral-600">Tu refugio todavía no recibió reseñas.</p>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="font-heading text-4xl text-neutral-900">{resenas.promedio?.toFixed(1)}</p>
              <Estrellas n={Math.round(resenas.promedio ?? 0)} />
              <p className="text-sm text-neutral-600">
                {resenas.cantidad} {resenas.cantidad === 1 ? "reseña" : "reseñas"}
              </p>
              <ul className="space-y-1 pt-2">
                {resenas.distribucion.map((d) => (
                  <li key={d.puntuacion} className="flex items-center gap-2 text-sm text-neutral-700">
                    <span className="w-4 text-right">{d.puntuacion}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{ width: `${(d.cantidad / maximoDistribucion) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right text-neutral-500">{d.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="space-y-3 md:col-span-2">
              {resenas.resenas.map((r) => (
                <li key={r.id} className="rounded-xl border border-neutral-300 bg-white/60 p-3">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600">
                    <Estrellas n={r.puntuacion} />
                    <span className="font-medium text-neutral-900">
                      {r.autor.nombre} {r.autor.apellido}
                    </span>
                    <span>· {dia(r.fecha)}</span>
                  </p>
                  {r.comentario && <p className="mt-1 whitespace-pre-wrap text-base text-neutral-800">{r.comentario}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
