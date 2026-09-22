/**
 * Favoritos (HU-6.6 listado, HU-7.2 alta). Contrato en
 * `pethood-backend/docs/api-favoritos.md`.
 */
import { del, get, post } from './api';
import type { AmbitoMascotas } from './mascotas';

/**
 * Una tarjeta del listado. Ojo con `id`: es el id de la **mascota**, no el del favorito
 * — la respuesta no trae un `favoritoId`. Es el que va en el DELETE.
 */
export interface MascotaFavorita {
  id: number;
  nombre: string | null;
  /** `AAAA-MM-DD` o null. La edad se formatea en el cliente con `edadEnTexto`. */
  fechaNacimiento: string | null;
  imagenUrl: string | null;
  especie: { id: number; nombre: string };
  raza: { id: number; nombre: string };
  /** Estado actual de la mascota. Viene con guión bajo (`En_Transito`). */
  estado: { id: number; nombre: string };
  /**
   * Publicación activa de la mascota, o null si ya no está publicada. Sin publicación no
   * hay nada que solicitar y la tarjeta no muestra el botón (HU-7.1).
   */
  publicacionId: number | null;
  /** Solicitud viva propia sobre esa publicación: la tarjeta pasa a "Solicitud enviada". */
  solicitudAbiertaId: number | null;
  fechaAgregado: string;
}

export interface ListaFavoritos {
  /** Contador del header. Siempre coincide con `favoritos.length`. */
  total: number;
  favoritos: MascotaFavorita[];
}

/**
 * La lista viene completa (no pagina) y **ya ordenada** por `fechaAgregado` descendente:
 * no reordenar en el cliente.
 */
export function listarFavoritos(): Promise<ListaFavoritos> {
  return get('/favoritos');
}

/**
 * Baja de un favorito. Idempotente: quitar algo que no está guardado también responde
 * 204, así que un reintento nunca rompe.
 */
export function quitarFavorito(mascotaId: number): Promise<void> {
  return del(`/favoritos/${mascotaId}`);
}

/**
 * Alta. En GUI-12 se usa **solo para el "Deshacer"** del toast; el alta normal la hace el
 * swipe de HU-6.5. También es idempotente.
 *
 * `ambito` viaja porque el switch "vista refugio" hace de cuenta que son dos cuentas
 * distintas: en PERSONAL el usuario puede guardar hasta una mascota de su propio refugio
 * (la trata como cualquier otro adoptante); en REFUGIO, no — ver `shared/ambito.ts` del
 * backend.
 */
export function agregarFavorito(
  mascotaId: number,
  ambito: AmbitoMascotas = 'PERSONAL',
): Promise<unknown> {
  return post('/favoritos', { mascotaId, ambito });
}
