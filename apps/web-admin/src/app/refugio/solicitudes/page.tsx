import { cookies } from "next/headers";

import { ExportacionRefugio } from "@/components/dashboard/ExportacionRefugio";
import { AccionesSolicitud } from "@/components/refugio/AccionesFilas";
import { EstadoChip } from "@/components/refugio/EstadoChip";
import { FiltroEstado, PaginacionUrl } from "@/components/refugio/FiltroEstado";
import { ConFoto, TablaListado } from "@/components/refugio/TablaListado";
import { AUTH_COOKIE } from "@/lib/auth";
import { dia, diasDesde, etiquetaEstado } from "@/lib/formato";
import { periodoPorDefecto } from "@/lib/periodo";
import { contarSolicitudesRecibidas, listarSolicitudesRecibidas, SOLICITUDES_POR_PAGINA } from "@/services/refugio";
import { ESTADOS_SOLICITUD, ESTADOS_SOLICITUD_ABIERTA, type FiltrosSolicitudesRecibidas } from "@/types/refugio";

interface PageProps {
  searchParams: Promise<{ estado?: string; page?: string }>;
}

/** Las que siguen esperando respuesta: en esas tiene sentido contar los días (HU-14.2). */
const ABIERTAS = new Set<string>(ESTADOS_SOLICITUD_ABIERTA);

/** Sin `?estado=` se ven las Pendiente: son las que el refugio tiene que resolver. */
const POR_DEFECTO = "Pendiente";
const TODAS = "todas";
/** Filtro especial del panel «Solicitudes que necesitan atención» del dashboard. */
const DEMORADAS = "demoradas";

const VALIDOS = new Set<string>([...ESTADOS_SOLICITUD, TODAS, DEMORADAS]);

const DESCRIPCION: Record<string, string> = {
  [DEMORADAS]: "Solicitudes pendientes o en revisión que llevan 5 días o más sin respuesta.",
  [TODAS]: "Todas las solicitudes de adopción y tránsito que recibió tu refugio.",
};

const VACIO: Record<string, string> = {
  [DEMORADAS]: "Ninguna solicitud lleva más de 5 días sin respuesta.",
  [TODAS]: "Tu refugio todavía no recibió solicitudes.",
  [POR_DEFECTO]: "No tenés solicitudes pendientes.",
};

// HU-7.4/7.5 — `GET /solicitudes/recibidas`, paginado por offset con total.
export default async function SolicitudesRefugioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const periodo = periodoPorDefecto();
  const estado = params.estado && VALIDOS.has(params.estado) ? params.estado : POR_DEFECTO;
  const filtros: FiltrosSolicitudesRecibidas = {
    page: Math.max(1, Number(params.page) || 1),
    estado,
  };
  const [lista, cantidades] = await Promise.all([
    listarSolicitudesRecibidas(filtros, token),
    contarSolicitudesRecibidas([...VALIDOS], token),
  ]);

  return (
    <TablaListado
      titulo="Solicitudes"
      descripcion={DESCRIPCION[estado] ?? "Solicitudes de adopción y tránsito que recibió tu refugio."}
      columnas={["Mascota", "Solicitante", "Tipo", "Estado", "Días", "Fecha", "Acciones"]}
      accion={<ExportacionRefugio entidad="solicitudes" periodo={periodo} token={token} variante="boton" />}
      filtros={
        <FiltroEstado
          ruta="/refugio/solicitudes"
          estado={estado}
          opcionTodos={{ valor: TODAS, etiqueta: "Todas", cantidad: cantidades[TODAS] }}
          opciones={ESTADOS_SOLICITUD.map((e) => ({ valor: e, etiqueta: etiquetaEstado(e), cantidad: cantidades[e] }))}
          especiales={[
            { valor: DEMORADAS, etiqueta: "Solicitudes demoradas", cantidad: cantidades[DEMORADAS], tono: "rojo" },
          ]}
        />
      }
      vacio={VACIO[estado] ?? "No hay solicitudes en ese estado."}
      filas={lista.solicitudes.map((s) => {
        const solicitante = `${s.solicitante.nombre} ${s.solicitante.apellido}`;
        const mascota = s.mascota.nombre ?? "la mascota";
        return {
          clave: s.id,
          celdas: [
            <ConFoto key="m" imagenUrl={s.mascota.imagenUrl} texto={s.mascota.nombre ?? "Sin nombre"} />,
            solicitante,
            etiquetaEstado(s.tipoSolicitud),
            <EstadoChip key="e" nombre={s.estado.nombre} />,
            ABIERTAS.has(s.estado.nombre) ? diasDesde(s.fechaAlta) : "-",
            dia(s.fechaAlta),
            <AccionesSolicitud
              key="a"
              id={s.id}
              estado={s.estado.nombre}
              tipo={s.tipoSolicitud}
              solicitante={solicitante}
              mascota={mascota}
              token={token}
            />,
          ],
        };
      })}
      pie={
        <PaginacionUrl
          ruta="/refugio/solicitudes"
          filtros={filtros}
          page={filtros.page}
          limit={SOLICITUDES_POR_PAGINA}
          total={lista.total}
        />
      }
    />
  );
}
