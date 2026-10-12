/**
 * A qué pantalla lleva una notificación (spec 004). Lo usan la bandeja y el toque de un push:
 * las dos reciben lo mismo, el tipo de entidad y su id.
 */
export interface RutaNotificacion {
  pathname: string;
  params?: Record<string, unknown>;
}

/**
 * `null` = no hay una pantalla razonable; quien llama decide (la bandeja solo marca leída, un
 * push abre la bandeja).
 */
export function rutaDeNotificacion(
  entidadTipo: string | null | undefined,
  entidadId: number | null | undefined,
): RutaNotificacion | null {
  if (!entidadTipo || entidadId === null || entidadId === undefined) return null;

  switch (entidadTipo) {
    case 'SOLICITUD':
      return { pathname: '/solicitudes/[id]', params: { id: entidadId } };
    case 'CHAT':
      return { pathname: '/chats/[chatId]', params: { chatId: entidadId } };
    case 'SEGUIMIENTO':
      return {
        pathname: '/seguimientos/actualizaciones/[seguimientoId]',
        params: { seguimientoId: entidadId },
      };
    case 'MASCOTA':
      return { pathname: '/mascotas/[id]', params: { id: entidadId } };
    case 'PUBLICACION':
      return { pathname: '/publicaciones/[id]', params: { id: entidadId } };
    // La mascota ya no está disponible: la ficha no existe, pero Favoritos la muestra con su
    // estado ("No disponible" o "Adoptado").
    case 'FAVORITOS':
      return { pathname: '/favoritos' };
    // Del lado del donante: el listado de campañas.
    case 'CAMPANIA':
      return { pathname: '/campanias' };
    // Del lado del refugio: las donaciones de esa campaña.
    case 'CAMPANIA_REFUGIO':
      return {
        pathname: '/campanias/refugio/[id]/donaciones',
        params: { id: entidadId },
      };
    case 'RESENA':
      return { pathname: '/resenas' };
    case 'REFUGIO':
      return { pathname: '/perfil/refugio' };
    case 'PERFIL':
      return { pathname: '/perfil/editar' };
    default:
      return null;
  }
}
