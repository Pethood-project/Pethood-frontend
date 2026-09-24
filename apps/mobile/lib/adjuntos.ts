/**
 * Qué es cada adjunto de un mensaje: una imagen o un video.
 *
 * **El cliente no adivina por la extensión.** Los dos únicos lugares de donde sale un
 * adjunto ya traen el dato:
 *
 * - Los del servidor vienen en `Mensaje.adjuntos`, con el `tipo` ya resuelto por el backend.
 * - Los que el usuario acaba de elegir traen el mimetype real que devolvió el selector.
 *
 * Por eso acá sólo hay una función: clasificar un mimetype. Deducirlo de la uri sería
 * frágil, y en web directamente imposible — el selector devuelve `blob:…` sin extensión.
 *
 * Espejo de `pethood-backend/src/shared/adjuntos.ts` en lo conceptual, no en la firma: el
 * backend además clasifica URLs guardadas, que es algo que el cliente nunca necesita hacer.
 */
import { LIMITES } from '@/shared/validation/limits';

export type TipoAdjunto = 'IMAGEN' | 'VIDEO';

/** Un adjunto listo para pintar: la uri (local o absoluta del servidor) y qué es. */
export interface Adjunto {
  uri: string;
  tipo: TipoAdjunto;
}

const MIMES_VIDEO: readonly string[] = LIMITES.video.formatos;

/** `true` si el mimetype es uno de los formatos de video que el chat acepta. */
export function esMimeDeVideo(mimeType: string | null | undefined): boolean {
  const normalizado = mimeType?.toLowerCase().trim() ?? '';
  return MIMES_VIDEO.includes(normalizado);
}

/**
 * El tipo de lo que eligió el usuario. Ante la duda, `IMAGEN`: es lo que era todo antes de
 * que existiera el video, y un mimetype que el backend no acepta va a rebotar igual.
 */
export function tipoDeMime(mimeType: string | null | undefined): TipoAdjunto {
  return esMimeDeVideo(mimeType) ? 'VIDEO' : 'IMAGEN';
}

/** `true` si alguno de los adjuntos elegidos es un video. */
export function hayVideo(adjuntos: { tipo: string }[]): boolean {
  return adjuntos.some((adjunto) => esMimeDeVideo(adjunto.tipo));
}
