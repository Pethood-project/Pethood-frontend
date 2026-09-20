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
import type { Mensaje, SolicitudEnChat } from '@/services/chats';
import { etiquetaDia, inicioDelDia } from '@/shared/validation/dates';

/** Un mensaje que el usuario mandó y todavía no confirmó el servidor. */
export interface MensajePendiente {
  /** Identidad local: es la clave de la lista y con la que se lo reemplaza al confirmar. */
  claveLocal: string;
  contenido: string;
  /** Se conservan para poder reintentar sin que el usuario vuelva a elegir las fotos. */
  fotos: ArchivoAdjunto[];
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
  /**
   * URLs absolutas del servidor, o uris locales mientras las fotos suben. Vacío si el
   * mensaje es sólo texto.
   */
  imagenes: string[];
  esMio: boolean;
  /** ISO del servidor. `null` en un pendiente: todavía no hay hora oficial. */
  fecha: string | null;
  /** Le llegó al destinatario. Sólo tiene sentido en los propios. */
  entregado: boolean;
  /** Lo leyó el destinatario. Sólo tiene sentido en los propios. */
  leido: boolean;
  /** `SOLICITUD` se pinta como tarjeta y no como burbuja. */
  tipo: 'TEXTO' | 'SOLICITUD';
  /** Sólo en los de tipo `SOLICITUD`. */
  solicitud: SolicitudEnChat | null;
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
 * Avanza el acuse de los mensajes PROPIOS hasta la fecha que informó el evento
 * (`chat:leido` o `chat:entregado`).
 *
 * `hasta` acota el avance en vez de marcar la sala entera: si entró un mensaje nuestro
 * justo después de que el otro leyera, ése tiene que seguir sin acusar. Leer implica haber
 * recibido, así que una lectura también adelanta la entrega.
 */
export function marcarMisMensajesAcusados(
  lista: Mensaje[],
  miUsuarioId: number,
  acuse: 'entregado' | 'leido',
  hasta: string,
): Mensaje[] {
  const tope = Date.parse(hasta);

  const alcanza = (mensaje: Mensaje): boolean =>
    mensaje.usuarioId === miUsuarioId &&
    Date.parse(mensaje.fechaAlta) <= tope &&
    !mensaje[acuse];

  if (!lista.some(alcanza)) return lista;

  return lista.map((mensaje) =>
    alcanza(mensaje)
      ? {
          ...mensaje,
          entregado: true,
          ...(acuse === 'leido' ? { leido: true, fechaLectura: hasta } : {}),
        }
      : mensaje,
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
      pendiente.fotos.length === mensaje.imagenes.length,
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
      // Las miniaturas salen de las uris locales: las del servidor todavía no existen.
      imagenes: pendiente.fotos.map((foto) => foto.uri),
      esMio: true,
      fecha: null,
      entregado: false,
      leido: false,
      tipo: 'TEXTO' as const,
      solicitud: null,
      estado: pendiente.fallo ? ('error' as const) : ('enviando' as const),
    }))
    // Los pendientes se guardan en orden de envío y la lista va al revés.
    .reverse();

  const enviados: ItemChat[] = confirmados.map((mensaje) => ({
    clave: String(mensaje.id),
    contenido: mensaje.contenido,
    // `urlAbsoluta` devuelve null sólo con entrada vacía; acá nunca lo es.
    imagenes: mensaje.imagenes.map((ruta) => urlAbsoluta(ruta) ?? ruta),
    // Un mensaje de sistema lo emite SISTEMA, que no participa de la sala: nunca es propio.
    esMio: mensaje.tipo === 'TEXTO' && mensaje.usuarioId === miUsuarioId,
    fecha: mensaje.fechaAlta,
    entregado: mensaje.entregado,
    leido: mensaje.leido,
    tipo: mensaje.tipo,
    solicitud: mensaje.solicitud,
    estado: 'enviado' as const,
  }));

  return [...enVuelo, ...enviados];
}

// ─── Separadores de día (artboards 35 y 37) ───

/** Una fila de la lista de la sala: un mensaje o el chip que abre una jornada. */
export type FilaSala =
  | { tipo: 'mensaje'; clave: string; item: ItemChat }
  | { tipo: 'separador'; clave: string; etiqueta: string };

/** Día calendario de un ítem. Un pendiente no tiene fecha del servidor: cuenta como de hoy. */
function diaDe(item: ItemChat, ahora: Date): number {
  return inicioDelDia(item.fecha ? new Date(item.fecha) : ahora).getTime();
}

/**
 * Intercala el chip de día ("Hoy", "Ayer", fecha) entre los mensajes.
 *
 * La lista está en orden DESCENDENTE para la `FlatList inverted`, así que el separador de
 * una jornada va DESPUÉS de su mensaje más viejo en el array: en pantalla queda arriba del
 * primer mensaje de ese día, que es donde lo pone el diseño.
 *
 * Es presentación pura: no toca los mensajes ni su orden, sólo agrega filas.
 */
export function intercalarSeparadores(items: ItemChat[], ahora: Date): FilaSala[] {
  const filas: FilaSala[] = [];

  items.forEach((item, indice) => {
    filas.push({ tipo: 'mensaje', clave: item.clave, item });

    const dia = diaDe(item, ahora);
    const siguiente = items[indice + 1];

    if (!siguiente || diaDe(siguiente, ahora) !== dia) {
      filas.push({
        tipo: 'separador',
        clave: `dia-${dia}`,
        etiqueta: etiquetaDia(new Date(dia), ahora),
      });
    }
  });

  return filas;
}
