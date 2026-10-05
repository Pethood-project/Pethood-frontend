/**
 * Perfiles públicos de otra persona y de un refugio (spec 023). Solo lectura, cualquier
 * sesión. Nunca traen email, teléfono ni DNI: el contacto es por chat.
 */
import { get } from './api';
import type { FeedPublicaciones } from './publicaciones';

export interface PerfilPersona {
  id: number;
  nombre: string;
  apellido: string;
  imagenUrl: string | null;
  verificado: boolean;
  provincia: string | null;
  localidad: string | null;
  fechaAlta: string;
  /** El backend lo calcula: oculta «Reportar» en el perfil propio. */
  esPropio: boolean;
}

export interface PerfilRefugio {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  verificado: boolean;
  provincia: string | null;
  localidad: string | null;
  calleAltura: string | null;
  mapaUrl: string | null;
  fechaAlta: string;
  resumen: {
    publicacionesActivas: number;
    resenas: { promedio: number | null; cantidad: number };
  };
  /** El backend lo calcula: oculta «Reportar» a los miembros del propio refugio. */
  esMiembro: boolean;
}

export const obtenerPerfilPersona = (id: number) => get<PerfilPersona>(`/usuarios/${id}/perfil`);

export const obtenerPerfilRefugio = (id: number) => get<PerfilRefugio>(`/refugios/${id}`);

/** Tamaño de página de las publicaciones de un perfil. */
export const PAGINA_PERFIL = 10;

/**
 * Publicaciones activas de un refugio (`refugioId`) o de una persona a título personal
 * (`usuarioId`). Es el feed de adopción con un filtro más: pagina por offset y solo existe
 * en el perfil personal (el backend lo rechaza desde la vista de refugio).
 */
export function listarPublicacionesDe(
  publicador: { refugioId: number } | { usuarioId: number },
  desplazamiento = 0,
): Promise<FeedPublicaciones> {
  const params = new URLSearchParams(
    Object.entries(publicador).map(([clave, valor]) => [clave, String(valor)]),
  );
  params.set('limite', String(PAGINA_PERFIL));
  params.set('desplazamiento', String(desplazamiento));
  return get(`/publicaciones?${params.toString()}`);
}
