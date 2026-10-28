import { cookies } from "next/headers";

import { AccionesPublicacion } from "@/components/refugio/AccionesFilas";
import { EstadoChip } from "@/components/refugio/EstadoChip";
import { FiltroEstado } from "@/components/refugio/FiltroEstado";
import { ConFoto, TablaListado } from "@/components/refugio/TablaListado";
import { AUTH_COOKIE } from "@/lib/auth";
import { dia, diasDesde, etiquetaEstado } from "@/lib/formato";
import { listarPublicacionesRefugio } from "@/services/refugio";

interface PageProps {
  searchParams: Promise<{ estado?: string }>;
}

/** Filtro especial del panel «Publicaciones que llevan mucho tiempo activas» del dashboard. */
const ANTIGUAS = "antiguas";

// `GET /publicaciones/mias` no pagina: el filtro por estado se aplica acá sobre el nombre del
// catálogo. «Antiguas» lo resuelve el back, con el mismo criterio que el dashboard.
export default async function PublicacionesRefugioPage({ searchParams }: PageProps) {
  const { estado } = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const antiguas = estado === ANTIGUAS;
  // Las dos listas siempre: la completa da los contadores de cada chip y la de antiguas, el suyo.
  const [todas, listaAntiguas] = await Promise.all([
    listarPublicacionesRefugio(token),
    listarPublicacionesRefugio(token, true),
  ]);

  const estados = ["Activa", "Pausada", "Finalizada"];
  const visibles = antiguas ? listaAntiguas : estado ? todas.filter((p) => p.estado.nombre === estado) : todas;

  return (
    <TablaListado
      titulo="Publicaciones"
      descripcion={
        antiguas
          ? "Publicaciones activas o pausadas que llevan 60 días o más publicadas."
          : "Avisos de adopción de tu refugio."
      }
      columnas={["Título", "Mascota", "Especie", "Estado", "Solicitudes", "Publicada", "Acciones"]}
      filtros={
        <FiltroEstado
          ruta="/refugio/publicaciones"
          estado={estado}
          opcionTodos={{ valor: "", etiqueta: "Todas", cantidad: todas.length }}
          opciones={estados.map((e) => ({
            valor: e,
            etiqueta: etiquetaEstado(e),
            cantidad: todas.filter((p) => p.estado.nombre === e).length,
          }))}
          especiales={[
            { valor: ANTIGUAS, etiqueta: "Publicaciones antiguas", cantidad: listaAntiguas.length, tono: "naranja" },
          ]}
        />
      }
      vacio={
        antiguas
          ? "Ninguna publicación lleva más de 60 días activa."
          : estado
            ? "No hay publicaciones en ese estado."
            : "Tu refugio todavía no publicó avisos."
      }
      filas={visibles.map((p) => ({
        clave: p.id,
        celdas: [
          <ConFoto key="t" imagenUrl={p.imagenUrl} texto={p.titulo} />,
          p.mascota.nombre ?? "Sin nombre",
          p.mascota.especie.nombre,
          <EstadoChip key="e" nombre={p.estado.nombre} />,
          p.cantidadSolicitudes,
          `${dia(p.fechaPublicacion)} · ${diasDesde(p.fechaPublicacion)} días`,
          <AccionesPublicacion key="a" id={p.id} estado={p.estado.nombre} token={token} />,
        ],
      }))}
    />
  );
}
