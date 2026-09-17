/**
 * Lógica de la lista de mensajes de una conversación (HU-5.2). Funciones puras: el hook
 * `useSalaChat` se ocupa de los efectos, acá sólo se transforman datos.
 *
 * En la sala conviven mensajes de TRES orígenes distintos y el problema es que no se pisen:
 *
 * 1. El historial paginado, que llega de a páginas hacia atrás en el tiempo.
 * 2. Los que el usuario acaba de escribir y todavía están en vuelo (update optimista).
 * 3. Los que llegan por socket — incluidos **los propios**, porque el backend le manda el
 *    broadcast a todos los participantes y el emisor no se excluye (ver `api-chat-sala.md`).
 *
 * La separación en dos listas es lo que resuelve el orden: los confirmados se ordenan por
 * la fecha DEL SERVIDOR y los pendientes van siempre arriba, sin mezclarse. Si los
 * pendientes se ordenaran junto con los demás habría que darles una fecha, y la del
 * cliente puede estar corrida respecto de la del servidor: la burbuja saltaría de lugar al
 * confirmarse.
 */
import type { ArchivoAdjunto } from '@/services/api';
import { urlAbsoluta } from '@/services/api';
import type { Mensaje } from '@/services/chats';

/** Un mensaje que el usuario mandó y todavía no confirmó el servidor. */
export interface MensajePendiente {
  /** Identidad local: es la clave de la lista y con la que se lo reemplaza al confirmar. */
  claveLocal: string;
  contenido: string;
  /** Se conserva para poder reintentar sin que el usuario vuelva a elegir la foto. */
  foto: ArchivoAdjunto | null;
  /** `true` si el envío falló y la burbuja ofrece reintentar. */
  fallo: boolean;
}

/**
 * Lo que pinta la lista. Es un view-model deliberado: la burbuja no tiene que saber si el
 * mensaje viene del historial, del socket o de un envío en vuelo.
 */
export interface ItemChat {
  clave: string;
  contenido: string;
  /** URL absoluta del servidor, o uri local mientras la foto sube. `null` si es sólo texto. */
  imagen: string | null;
  esMio: boolean;
  /** ISO del servidor. `null` en un pendiente: todavía no hay hora oficial. */
  fecha: string | null;
  /** Doble check. Sólo tiene sentido en los propios. */
  leido: boolean;
  estado: 'enviado' | 'enviando' | 'error';
}

/**
 * Orden del servidor: más reciente primero, desempatando por id.
 *
 * Es el MISMO criterio que usa el backend (`fechaAlta DESC, id DESC`), y tiene que serlo:
 * si acá se ordenara distinto, un mensaje que llega por socket se insertaría en un lugar y
 * al refetchear el historial aparecería en otro.
 */
function porMasReciente(a: Mensaje, b: Mensaje): number {
  const diferencia = Date.parse(b.fechaAlta) - Date.parse(a.fechaAlta);
  return diferencia !== 0 ? diferencia : b.id - a.id;
}

/**
 * Inserta un mensaje del servidor, ignorándolo si ya estaba.
 *
 * La deduplicación por `id` es obligatoria y no una precaución: el emisor recibe su propio
 * mensaje dos veces (la respuesta del POST y el broadcast), y al reconectar el refetch del
 * historial se superpone con los eventos que ya habían llegado.
 */
export function insertarMensaje(lista: Mensaje[], mensaje: Mensaje): Mensaje[] {
  if (lista.some((existente) => existente.id === mensaje.id)) return lista;
  return [...lista, mensaje].sort(porMasReciente);
}

/** Mezcla una página del historial (o un refetch entero) descartando lo repetido. */
export function mezclarPagina(lista: Mensaje[], pagina: Mensaje[]): Mensaje[] {
  const conocidos = new Set(lista.map((mensaje) => mensaje.id));
  const nuevos = pagina.filter((mensaje) => !conocidos.has(mensaje.id));

  if (nuevos.length === 0) return lista;
  return [...lista, ...nuevos].sort(porMasReciente);
}

/**
 * Marca como leídos los mensajes PROPIOS: el otro abrió la sala (evento `chat:leido`).
 *
 * Se marcan todos y no algunos porque leer es una operación de sala entera — el backend
 * hace exactamente lo mismo con un solo UPDATE.
 */
export function marcarMisMensajesLeidos(lista: Mensaje[], miUsuarioId: number): Mensaje[] {
  if (!lista.some((mensaje) => mensaje.usuarioId === miUsuarioId && !mensaje.leido)) {
    return lista;
  }

  return lista.map((mensaje) =>
    mensaje.usuarioId === miUsuarioId ? { ...mensaje, leido: true } : mensaje,
  );
}

/**
 * Saca el pendiente que corresponde a un mensaje propio recién confirmado.
 *
 * Hace falta porque el broadcast puede ganarle a la respuesta del POST: sin esto, entre un
 * evento y el otro la burbuja se vería DUPLICADA. Como el evento no trae la clave local, se
 * lo empareja por contenido y por si lleva foto.
 *
 * Con dos mensajes idénticos seguidos ("ok", "ok") se saca el primero de la cola, que es el
 * que se mandó primero: son intercambiables, y cuando llegue el segundo evento se sacará el
 * otro. El orden final lo fija igual la fecha del servidor.
 */
export function quitarPendienteConfirmado(
  pendientes: MensajePendiente[],
  mensaje: Mensaje,
): MensajePendiente[] {
  const indice = pendientes.findIndex(
    (pendiente) =>
      !pendiente.fallo &&
      pendiente.contenido === mensaje.contenido &&
      (pendiente.foto !== null) === (mensaje.imagenUrl !== null),
  );

  if (indice === -1) return pendientes;
  return pendientes.filter((_, posicion) => posicion !== indice);
}

/**
 * Arma lo que se pinta: los pendientes arriba (son lo último que pasó) y abajo el
 * historial confirmado.
 *
 * El array resultante está en orden descendente, que es justo lo que consume una
 * `FlatList inverted` sin darlo vuelta.
 */
export function aItems(
  confirmados: Mensaje[],
  pendientes: MensajePendiente[],
  miUsuarioId: number,
): ItemChat[] {
  const enVuelo: ItemChat[] = pendientes
    .map((pendiente) => ({
      clave: pendiente.claveLocal,
      contenido: pendiente.contenido,
      // La miniatura sale de la uri local: la del servidor todavía no existe.
      imagen: pendiente.foto?.uri ?? null,
      esMio: true,
      fecha: null,
      leido: false,
      estado: pendiente.fallo ? ('error' as const) : ('enviando' as const),
    }))
    // Los pendientes se guardan en orden de envío y la lista va al revés.
    .reverse();

  const enviados: ItemChat[] = confirmados.map((mensaje) => ({
    clave: String(mensaje.id),
    contenido: mensaje.contenido,
    imagen: urlAbsoluta(mensaje.imagenUrl),
    esMio: mensaje.usuarioId === miUsuarioId,
    fecha: mensaje.fechaAlta,
    leido: mensaje.leido,
    estado: 'enviado' as const,
  }));

  return [...enVuelo, ...enviados];
}
