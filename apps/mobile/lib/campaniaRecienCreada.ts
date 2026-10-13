/**
 * Aviso de una sola vez entre el alta de una campaña (GUI-37) y «Mis Campañas» (GUI-36), que
 * la abrió. Mismo patrón que `avisoRecienCreado.ts`: el alta vuelve con `router.back()` y el
 * listado la toma al recuperar el foco para ponerla arriba sin recargar.
 */
import type { CampaniaRefugio } from '../services/campanias';

let pendiente: CampaniaRefugio | null = null;

export function avisarCampaniaCreada(campania: CampaniaRefugio): void {
  pendiente = campania;
}

export function tomarCampaniaCreada(): CampaniaRefugio | null {
  const campania = pendiente;
  pendiente = null;
  return campania;
}
