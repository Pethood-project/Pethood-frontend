/**
 * Feed de mascotas en adopción y ficha completa de una publicación.
 *
 * El feed ya viene ordenado y sin las mascotas propias ni las que el usuario guardó en
 * favoritos: el cliente no vuelve a filtrar nada, solo pagina.
 */
import { get } from './api';
import type { AmbitoMascotas, Genero, Tamanio } from './mascotas';

export interface MascotaPublicada {
  id: number;
  nombre: string | null;
  /** `AAAA-MM-DD` o null. La edad se arma en el cliente con `edadEnTexto`. */
  fechaNacimiento: string | null;
  genero: Genero;
  tamanio: Tamanio | null;
  peso: number | null;
  castrado: boolean;
  descripcion: string | null;
  imagenUrl: string | null;
  especie: { id: number; nombre: string };
  raza: { id: number; nombre: string };
  /** Viene con guión bajo (`En_Transito`). En el feed siempre es `Disponible`. */
  estado: { id: number; nombre: string };
}

export interface PublicacionFeed {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  requisitos: string[];
  personalidad: string[];
  desparasitado: boolean;
  vacunas: string | null;
  /** En orden; la primera es la portada. Pasar por `urlAbsoluta` antes de mostrarlas. */
  imagenes: string[];
  fechaPublicacion: string;
  mascota: MascotaPublicada;
  /** Null cuando publica un adoptante particular. */
  refugio: { id: number; nombre: string; direccion: string } | null;
  enFavoritos: boolean;
  /**
   * Si la mascota es del usuario que consulta (o de su mismo refugio). El feed nunca la
   * devuelve en `true`: ya excluye esas publicaciones. La ficha sí puede, y la pantalla usa
   * este campo para no ofrecer "Solicitar adopción" ni el corazón de favoritos sobre la
   * propia mascota.
   */
  esPropia: boolean;
}

export interface FeedPublicaciones {
  /** Total que matchea los filtros, no el largo de esta página. */
  total: number;
  publicaciones: PublicacionFeed[];
}

/**
 * Filtros de búsqueda. Todos opcionales: un campo `undefined` no viaja y el backend no
 * aplica ese recorte.
 */
export interface FiltrosAdopcion {
  especieId?: number;
  tamanio?: Tamanio;
  genero?: Genero;
  /** Años cumplidos, inclusivo. */
  edadMin?: number;
  /** Años cumplidos, exclusivo: "1–3 años" es `{ edadMin: 1, edadMax: 3 }`. */
  edadMax?: number;
  castrado?: boolean;
  compatibleNinios?: boolean;
  compatibleOtrasMascotas?: boolean;
}

/** Filtros vacíos: el estado inicial de la pantalla y el resultado de "Limpiar". */
export const SIN_FILTROS: FiltrosAdopcion = {};

/** Cuántos recortes hay activos, para el contador del botón "Aplicar filtros (N)". */
export function contarFiltrosActivos(filtros: FiltrosAdopcion): number {
  let activos = 0;

  if (filtros.especieId !== undefined) activos += 1;
  if (filtros.tamanio !== undefined) activos += 1;
  if (filtros.genero !== undefined) activos += 1;
  // El rango de edad es una sola elección del usuario aunque viaje en dos campos.
  if (filtros.edadMin !== undefined || filtros.edadMax !== undefined) activos += 1;
  if (filtros.castrado) activos += 1;
  if (filtros.compatibleNinios) activos += 1;
  if (filtros.compatibleOtrasMascotas) activos += 1;

  return activos;
}

/** Las banderas en false no viajan: su ausencia ya significa "no filtrar por esto". */
function aQueryString(
  filtros: FiltrosAdopcion,
  limite: number,
  desplazamiento: number,
  ambito: AmbitoMascotas,
): string {
  const params = new URLSearchParams();

  if (filtros.especieId !== undefined) params.set('especieId', String(filtros.especieId));
  if (filtros.tamanio !== undefined) params.set('tamanio', filtros.tamanio);
  if (filtros.genero !== undefined) params.set('genero', filtros.genero);
  if (filtros.edadMin !== undefined) params.set('edadMin', String(filtros.edadMin));
  if (filtros.edadMax !== undefined) params.set('edadMax', String(filtros.edadMax));
  if (filtros.castrado) params.set('castrado', 'true');
  if (filtros.compatibleNinios) params.set('compatibleNinios', 'true');
  if (filtros.compatibleOtrasMascotas) params.set('compatibleOtrasMascotas', 'true');

  params.set('limite', String(limite));
  params.set('desplazamiento', String(desplazamiento));
  params.set('ambito', ambito);

  return params.toString();
}

/** Tamaño de página del feed. Coincide con el default del backend. */
export const TAMANIO_PAGINA = 20;

/**
 * `ambito` decide, junto con `usuarioId`, qué mascotas excluye el feed como "propias": en
 * REFUGIO también las de su refugio (aunque las haya cargado otro miembro), en PERSONAL
 * solo las que el usuario mismo publicó — ver `shared/ambito.ts` del backend.
 */
export function listarFeed(
  filtros: FiltrosAdopcion = SIN_FILTROS,
  desplazamiento = 0,
  limite = TAMANIO_PAGINA,
  ambito: AmbitoMascotas = 'PERSONAL',
): Promise<FeedPublicaciones> {
  return get(`/publicaciones?${aQueryString(filtros, limite, desplazamiento, ambito)}`);
}

export function obtenerPublicacion(
  id: number,
  ambito: AmbitoMascotas = 'PERSONAL',
): Promise<PublicacionFeed> {
  return get(`/publicaciones/${id}?ambito=${ambito}`);
}
