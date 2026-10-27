import { apiFetch, aQueryString } from "./api";
import type {
  AccionPublicacion,
  CampaniaRefugio,
  EstadoManualCampania,
  FiltrosSolicitudesRecibidas,
  ListaCampaniasRefugio,
  ListaSolicitudesRecibidas,
  MascotaRefugio,
  PerfilPublicoRefugio,
  PerfilRefugio,
  PublicacionRefugio,
  MotivoRechazo,
  ResolucionSolicitud,
  ResumenResenas,
} from "@/types/refugio";

// Listados del panel del refugio (GUI-26, GUI-36 y los de gestión). Se llaman desde server
// components con el token de la cookie.

export function listarMascotasRefugio(token: string): Promise<MascotaRefugio[]> {
  return apiFetch<MascotaRefugio[]>("/mascotas/mias", { token });
}

/** `antiguas`: solo las del panel «Publicaciones antiguas» del dashboard (mismo criterio en el back). */
export function listarPublicacionesRefugio(token: string, antiguas = false): Promise<PublicacionRefugio[]> {
  return apiFetch<PublicacionRefugio[]>(`/publicaciones/mias${aQueryString({ antiguas: antiguas || undefined })}`, { token });
}

export const SOLICITUDES_POR_PAGINA = 20;

export function listarSolicitudesRecibidas(
  filtros: FiltrosSolicitudesRecibidas,
  token: string,
  limite = SOLICITUDES_POR_PAGINA,
): Promise<ListaSolicitudesRecibidas> {
  const especial = filtros.estado === "todas" || filtros.estado === "demoradas";
  const query = aQueryString({
    estados: especial ? undefined : filtros.estado,
    demoradas: filtros.estado === "demoradas" || undefined,
    limite,
    desplazamiento: (filtros.page - 1) * limite,
  });
  return apiFetch<ListaSolicitudesRecibidas>(`/solicitudes/recibidas${query}`, { token });
}

/**
 * Cuántas solicitudes hay en cada filtro, para los contadores de los chips. El endpoint pagina,
 * así que se pide una fila por filtro y se lee `total` (en paralelo).
 */
export async function contarSolicitudesRecibidas(estados: string[], token: string): Promise<Record<string, number>> {
  const totales = await Promise.all(
    estados.map((estado) => listarSolicitudesRecibidas({ page: 1, estado }, token, 1).then((l) => l.total)),
  );
  return Object.fromEntries(estados.map((estado, i) => [estado, totales[i]]));
}

/** Tope de vueltas al recorrer el cursor: un refugio tiene a lo sumo 5 activas (regla 7). */
const MAX_PAGINAS_CAMPANIAS = 10;

/**
 * El endpoint pagina por cursor para la app; la tabla del panel las muestra todas, así que
 * recorre las páginas acá. Son pocas por refugio, así que el costo es mínimo.
 */
export async function listarCampaniasRefugio(token: string): Promise<CampaniaRefugio[]> {
  const campanias: CampaniaRefugio[] = [];
  let cursor: number | null = null;

  for (let i = 0; i < MAX_PAGINAS_CAMPANIAS; i++) {
    const pagina: ListaCampaniasRefugio = await apiFetch<ListaCampaniasRefugio>(
      `/refugio/campanias${aQueryString({ limite: 50, cursor: cursor ?? undefined })}`,
      { token },
    );
    campanias.push(...pagina.campanias);
    if (!pagina.hayMas || pagina.proximoCursor === null) break;
    cursor = pagina.proximoCursor;
  }

  return campanias;
}

export async function obtenerPerfilRefugio(token: string): Promise<PerfilRefugio> {
  const { refugio } = await apiFetch<{ refugio: PerfilRefugio }>("/refugio/perfil", { token });
  return refugio;
}

export function obtenerPerfilPublicoRefugio(id: number, token: string): Promise<PerfilPublicoRefugio> {
  return apiFetch<PerfilPublicoRefugio>(`/refugios/${id}`, { token });
}

export function listarResenasRefugio(id: number, token: string): Promise<ResumenResenas> {
  return apiFetch<ResumenResenas>(`/resenas/refugio/${id}`, { token });
}

// --- Acciones (se llaman desde componentes cliente del panel) --------------------------------

export function cambiarEstadoPublicacion(id: number, accion: AccionPublicacion, token: string): Promise<unknown> {
  return apiFetch(`/publicaciones/${id}/estado`, { method: "PATCH", token, body: { accion } });
}

/** Paso previo a aceptar: la persona ve que la solicitud ya fue revisada. */
export function marcarSolicitudRevisada(id: number, token: string): Promise<unknown> {
  return apiFetch(`/solicitudes/${id}/revisada`, { method: "POST", token });
}

export function resolverSolicitud(
  id: number,
  estado: ResolucionSolicitud,
  comentario: string,
  token: string,
  motivo?: MotivoRechazo,
): Promise<unknown> {
  return apiFetch(`/solicitudes/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado, comentario: comentario.trim() || undefined, motivo },
  });
}

export function cambiarEstadoCampania(id: number, estado: EstadoManualCampania, token: string): Promise<CampaniaRefugio> {
  return apiFetch<CampaniaRefugio>(`/refugio/campanias/${id}/estado`, { method: "PATCH", token, body: { estado } });
}

/** Multipart: los datos van como texto y la foto (opcional) en `imagen`. */
export async function actualizarPerfilRefugio(datos: FormData, token: string): Promise<PerfilRefugio> {
  const { refugio } = await apiFetch<{ refugio: PerfilRefugio }>("/refugio/perfil", { method: "PATCH", token, body: datos });
  return refugio;
}
