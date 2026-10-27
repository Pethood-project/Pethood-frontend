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
import {
  esTarjetaDeSistema,
  type AvisoEnChat,
  type MascotaEnChat,
  type Mensaje,
  type MensajeCitado,
  type SolicitudEnChat,
  type TipoMensaje,
  type UbicacionRefugioEnChat,
} from '@/services/chats';
import { tipoDeMime, type Adjunto, type TipoAdjunto } from '@/lib/adjuntos';
import { etiquetaDia, inicioDelDia } from '@/shared/validation/dates';

/**
 * La cita de un mensaje respondido, lista para pintar: la que va dentro de la burbuja que
 * responde y la que se ve arriba de la barra mientras se escribe la respuesta.
 *
 * Es la misma forma para las dos y para los dos orígenes (la que manda el servidor y la que
 * arma el cliente al deslizar una burbuja), así el componente no sabe de dónde salió.
 */
export interface CitaChat {
  /** Id del mensaje citado: con él se viaja a ese mensaje dentro de la lista. */
  id: number;
  /** El citado es propio: la cita dice "Vos" en vez del nombre del contacto. */
  esMia: boolean;
  contenido: string;
  /** Qué adjuntos llevaba, para el "Foto" / "Video" de la cita. `miniatura` es una uri absoluta. */
  adjunto: { tipo: TipoAdjunto; cantidad: number; miniatura: string | null } | null;
  /** El citado se eliminó: la cita lo dice y no muestra nada de lo que decía. */
  eliminado: boolean;
}

/** Un mensaje que el usuario mandó y todavía no confirmó el servidor. */
export interface MensajePendiente {
  /** Identidad local: es la clave de la lista y con la que se lo reemplaza al confirmar. */
  claveLocal: string;
  contenido: string;
  /** Se conservan para poder reintentar sin que el usuario vuelva a elegirlos. */
  fotos: ArchivoAdjunto[];
  /**
   * El mensaje que se está respondiendo, ya armado como cita: la burbuja en vuelo la muestra
   * igual que la va a mostrar el servidor, y su `id` es lo que viaja en el POST.
   */
  respondeA: CitaChat | null;
  /** `true` si el envío falló y la burbuja ofrece reintentar. */
  fallo: boolean;
}

/**
 * Lo que pinta la lista. Es un view-model deliberado: la burbuja no tiene que saber si el
 * mensaje viene del historial, del socket o de un envío en vuelo.
 */
export interface ItemChat {
  clave: string;
  /** Id del servidor, o `null` en un pendiente: todavía no se puede citar ni eliminar. */
  mensajeId: number | null;
  contenido: string;
  /**
   * Los adjuntos con su tipo ya resuelto: uri absoluta del servidor, o local mientras sube.
   * Vacío si el mensaje es sólo texto.
   *
   * El tipo **nunca** se deduce de la uri: en los confirmados viene del backend y en los
   * pendientes del mimetype que devolvió el selector. En web una uri local es un `blob:` sin
   * extensión, así que adivinar no era una opción.
   */
  adjuntos: Adjunto[];
  esMio: boolean;
  /** ISO del servidor. `null` en un pendiente: todavía no hay hora oficial. */
  fecha: string | null;
  /** Le llegó al destinatario. Sólo tiene sentido en los propios. */
  entregado: boolean;
  /** Lo leyó el destinatario. Sólo tiene sentido en los propios. */
  leido: boolean;
  /** Todo lo que no es `TEXTO` se pinta como tarjeta y no como burbuja. */
  tipo: TipoMensaje;
  /** Sólo en los de tipo `SOLICITUD`. */
  solicitud: SolicitudEnChat | null;
  /** Sólo en los de tipo `SOLICITUD`: la envió quien mira, así que la tarjeta va de su lado. */
  solicitudPropia: boolean;
  /** Sólo en los de tipo `ANIMAL_PERDIDO` (HU-13.2). */
  aviso: AvisoEnChat | null;
  /** Sólo en los de tipo `MASCOTA`: la mascota compartida. */
  mascota: MascotaEnChat | null;
  /** Sólo en los de tipo `UBICACION_REFUGIO`: la ubicación del refugio. */
  ubicacion: UbicacionRefugioEnChat | null;
  /** El autor lo eliminó: en lugar de la burbuja va el aviso, sin contenido ni adjuntos. */
  eliminado: boolean;
  /** El mensaje al que responde, o `null`. */
  respondeA: CitaChat | null;
  estado: 'enviado' | 'enviando' | 'error';
}

/** La cita que manda el servidor, en la forma que pinta la burbuja. */
function aCita(citado: MensajeCitado, miUsuarioId: number): CitaChat {
  return {
    id: citado.id,
    esMia: citado.usuarioId === miUsuarioId,
    contenido: citado.contenido,
    adjunto: citado.adjunto
      ? {
          tipo: citado.adjunto.tipo,
          cantidad: citado.adjunto.cantidad,
          miniatura: urlAbsoluta(citado.adjunto.miniaturaUrl),
        }
      : null,
    eliminado: citado.eliminado,
  };
}

/**
 * La cita de una burbuja que se acaba de deslizar para responderla. Sale de lo que la lista ya
 * tiene, sin pedirle nada al servidor: es la que se ve arriba de la barra y la que lleva la
 * burbuja en vuelo hasta que el servidor confirme la suya.
 *
 * Sólo tiene sentido para un mensaje confirmado (con `mensajeId`): un pendiente no se responde.
 */
export function citaDe(item: ItemChat): CitaChat | null {
  if (item.mensajeId === null) return null;

  const primero = item.adjuntos[0];

  return {
    id: item.mensajeId,
    esMia: item.esMio,
    contenido: item.contenido,
    adjunto: primero
      ? {
          tipo: primero.tipo,
          cantidad: item.adjuntos.length,
          miniatura: primero.tipo === 'IMAGEN' ? primero.uri : null,
        }
      : null,
    eliminado: item.eliminado,
  };
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

/** `true` si el servidor eliminó el mensaje, o el que cita, después de que lo cargamos. */
function seEliminoDespues(conocido: Mensaje, fresco: Mensaje): boolean {
  return (
    fresco.eliminado !== conocido.eliminado ||
    (fresco.respondeA?.eliminado ?? false) !== (conocido.respondeA?.eliminado ?? false)
  );
}

/**
 * Mezcla una página del historial (o un refetch entero) descartando lo repetido.
 *
 * De un mensaje que ya estaba sólo se toma la versión nueva si se eliminó (él o el que cita):
 * es lo único que le puede pasar a un mensaje ya enviado, y si pasó con el socket caído el
 * evento se perdió y este refetch es la única forma de enterarse.
 */
export function mezclarPagina(lista: Mensaje[], pagina: Mensaje[]): Mensaje[] {
  const frescos = new Map(pagina.map((mensaje) => [mensaje.id, mensaje]));

  let huboCambios = false;
  const actualizada = lista.map((conocido) => {
    const fresco = frescos.get(conocido.id);
    if (!fresco || !seEliminoDespues(conocido, fresco)) return conocido;

    huboCambios = true;
    return fresco;
  });

  const conocidos = new Set(lista.map((mensaje) => mensaje.id));
  const nuevos = pagina.filter((mensaje) => !conocidos.has(mensaje.id));

  if (nuevos.length === 0) return huboCambios ? actualizada : lista;
  return [...actualizada, ...nuevos].sort(porMasReciente);
}

/**
 * Aplica la eliminación de un mensaje (`chat:mensaje-eliminado`, o la respuesta del DELETE):
 * la burbuja pasa a ser el aviso y pierde todo lo que decía, y las respuestas que lo citaban
 * pasan a decir que el citado se eliminó.
 *
 * Es lo mismo que mandaría el servidor si se volviera a pedir el historial, así que un
 * refetch posterior no cambia nada. Si el mensaje no está cargado, devuelve la lista intacta.
 */
export function marcarEliminado(lista: Mensaje[], mensajeId: number): Mensaje[] {
  const afectado = (mensaje: Mensaje): boolean =>
    (mensaje.id === mensajeId && !mensaje.eliminado) ||
    (mensaje.respondeA?.id === mensajeId && !mensaje.respondeA.eliminado);

  if (!lista.some(afectado)) return lista;

  return lista.map((mensaje) => {
    if (mensaje.id === mensajeId) {
      return {
        ...mensaje,
        eliminado: true,
        contenido: '',
        imagenUrl: null,
        imagenes: [],
        adjuntos: [],
        respondeA: null,
        mascota: null,
        ubicacion: null,
      };
    }

    if (mensaje.respondeA?.id === mensajeId) {
      return {
        ...mensaje,
        respondeA: { ...mensaje.respondeA, contenido: '', adjunto: null, eliminado: true },
      };
    }

    return mensaje;
  });
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
 * lo empareja por contenido, por cuántos adjuntos lleva y por a qué mensaje responde.
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
      pendiente.fotos.length === mensaje.imagenes.length &&
      (pendiente.respondeA?.id ?? null) === (mensaje.respondeA?.id ?? null),
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
      mensajeId: null,
      contenido: pendiente.contenido,
      // Las miniaturas salen de las uris locales: las del servidor todavía no existen. El
      // `tipo` de `ArchivoAdjunto` es el mimetype, que es de donde sale si es foto o video.
      adjuntos: pendiente.fotos.map((foto) => ({
        uri: foto.uri,
        tipo: tipoDeMime(foto.tipo),
      })),
      esMio: true,
      fecha: null,
      entregado: false,
      leido: false,
      tipo: 'TEXTO' as const,
      solicitud: null,
      solicitudPropia: false,
      aviso: null,
      mascota: null,
      ubicacion: null,
      eliminado: false,
      respondeA: pendiente.respondeA,
      estado: pendiente.fallo ? ('error' as const) : ('enviando' as const),
    }))
    // Los pendientes se guardan en orden de envío y la lista va al revés.
    .reverse();

  const enviados: ItemChat[] = confirmados.map((mensaje) => ({
    clave: String(mensaje.id),
    mensajeId: mensaje.id,
    contenido: mensaje.contenido,
    // `urlAbsoluta` devuelve null sólo con entrada vacía; acá nunca lo es. El tipo lo
    // manda el backend en `adjuntos`, el cliente no lo deduce.
    adjuntos: mensaje.adjuntos.map((adjunto) => ({
      uri: urlAbsoluta(adjunto.url) ?? adjunto.url,
      tipo: adjunto.tipo,
    })),
    // Una tarjeta de sistema la emite SISTEMA, que no participa de la sala: nunca es propia.
    // Las que manda una persona (mascota, ubicación) sí tienen dueño, como un texto.
    esMio: !esTarjetaDeSistema(mensaje.tipo) && mensaje.usuarioId === miUsuarioId,
    fecha: mensaje.fechaAlta,
    entregado: mensaje.entregado,
    leido: mensaje.leido,
    tipo: mensaje.tipo,
    solicitud: mensaje.solicitud,
    solicitudPropia: mensaje.solicitud?.usuarioId === miUsuarioId,
    aviso: mensaje.aviso,
    mascota: mensaje.mascota ?? null,
    ubicacion: mensaje.ubicacion ?? null,
    // `?? false` / `?? null`: un backend anterior a esta versión no manda los campos.
    eliminado: mensaje.eliminado ?? false,
    respondeA: mensaje.respondeA ? aCita(mensaje.respondeA, miUsuarioId) : null,
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
