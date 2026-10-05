/**
 * Aviso de una sola vez entre el alta de un aviso de mascota perdida (GUI-25) y el portal
 * (GUI-06) que la abrió. Mismo patrón que `mascotaParaPublicar.ts`.
 *
 * El alta vuelve con `router.back()` y deja acá el aviso que devolvió el backend; el portal lo
 * toma al recuperar el foco y lo pone arriba de la grilla sin recargarla (el orden por defecto
 * es "más reciente primero"). Es memoria del módulo y no un parámetro de ruta porque volver
 * atrás no lleva params.
 */
import type { AvisoPerdido } from '../services/animalesPerdidos';

let pendiente: AvisoPerdido | null = null;

/** Lo llama el alta justo antes de volver al portal. */
export function avisarAvisoCreado(aviso: AvisoPerdido): void {
  pendiente = aviso;
}

/** Devuelve el aviso recién creado, si hay, y lo consume: sirve una sola vez. */
export function tomarAvisoCreado(): AvisoPerdido | null {
  const aviso = pendiente;
  pendiente = null;
  return aviso;
}

let editado: AvisoPerdido | null = null;

/**
 * Lo mismo para la edición (HU-13.3): la pantalla de edición vuelve con `router.back()` y deja
 * acá el aviso actualizado, para que la que la abrió (el portal o la sala del chat) lo refleje
 * sin recargar todo. Mis publicaciones no lo necesita: recarga sola al recuperar el foco.
 */
export function avisarAvisoEditado(aviso: AvisoPerdido): void {
  editado = aviso;
}

/** Devuelve el aviso recién editado, si hay, y lo consume: sirve una sola vez. */
export function tomarAvisoEditado(): AvisoPerdido | null {
  const aviso = editado;
  editado = null;
  return aviso;
}
