/**
 * Aviso de una sola vez entre el alta de mascota y el alta de publicación que la pidió.
 *
 * Desde "Nueva publicación" se puede elegir "Crear mascota nueva": el alta de mascota se abre
 * ENCIMA del formulario de publicación (que conserva lo que ya se escribió) y, al crearla,
 * deja acá su id y vuelve con `router.back()`. La publicación lo toma al recuperar el foco y
 * la deja elegida.
 *
 * Es memoria del módulo y no un parámetro de ruta porque volver atrás no lleva params, y
 * reemplazar la pantalla de publicación para pasarlos borraría el formulario a medio llenar.
 */
let pendiente: number | null = null;

/** Lo llama el alta de mascota justo antes de volver a la publicación. */
export function avisarMascotaParaPublicar(mascotaId: number): void {
  pendiente = mascotaId;
}

/** Devuelve la mascota recién creada, si hay, y la consume: el aviso sirve una sola vez. */
export function tomarMascotaParaPublicar(): number | null {
  const mascotaId = pendiente;
  pendiente = null;
  return mascotaId;
}
