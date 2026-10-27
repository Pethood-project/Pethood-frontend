/**
 * Chat: listado de conversaciones (HU-5.1) y sala (HU-5.2). Contratos en
 * `pethood-backend/docs/api-chats.md` y `api-chat-sala.md`.
 */
import { adjuntarArchivo, del, get, post, postFormData, type ArchivoAdjunto } from './api';
import type { TipoAdjunto } from '@/lib/adjuntos';
import type { Genero, Tamanio } from '@/services/mascotas';

/**
 * Qué es un mensaje. Todo lo que no es `TEXTO` es una tarjeta: `SOLICITUD` y `ANIMAL_PERDIDO`
 * las emite PetHood; `MASCOTA` y `UBICACION_REFUGIO` las manda una persona de la sala.
 */
export type TipoMensaje =
  | 'TEXTO'
  | 'SOLICITUD'
  | 'SOLICITUD_ESTADO'
  | 'ANIMAL_PERDIDO'
  | 'MASCOTA'
  | 'UBICACION_REFUGIO';

/**
 * Lo que emite PetHood: no es de nadie de la sala. `SOLICITUD_ESTADO` no es una tarjeta sino una
 * línea de aviso, con el texto en `contenido`.
 */
export function esTarjetaDeSistema(tipo: TipoMensaje): boolean {
  return tipo === 'SOLICITUD' || tipo === 'SOLICITUD_ESTADO' || tipo === 'ANIMAL_PERDIDO';
}

/**
 * Una mascota compartida en la sala, para su tarjeta y para la lista que la elige. Se resuelve
 * en cada pedido: si la adoptaron o se despublicó, la tarjeta lo muestra.
 */
export interface MascotaEnChat {
  id: number;
  /** `null` si no tiene nombre cargado. */
  nombre: string | null;
  especie: string;
  raza: string;
  genero: Genero;
  tamanio: Tamanio | null;
  /** Sólo el día (`AAAA-MM-DD`), o `null`. La edad la calcula `etiquetaEdad`. */
  fechaNacimiento: string | null;
  /** Ruta relativa: pasarla por `urlAbsoluta`. */
  imagenUrl: string | null;
  /** Estado vigente ("Disponible", "Adoptado"…), o `null`. */
  estado: string | null;
  /** A dónde lleva "Ver mascota". `null` si ya no está publicada: no hay botón. */
  publicacionId: number | null;
}

/** La ubicación del refugio de la sala, sacada de su perfil en cada pedido. */
export interface UbicacionRefugioEnChat {
  refugioId: number;
  nombre: string;
  /** Ruta relativa: pasarla por `urlAbsoluta`. */
  imagenUrl: string | null;
  /** «calle y altura, localidad - provincia», o `null`. */
  ubicacion: string | null;
  /** Link de Google Maps, o `null`. Nunca vienen los dos en `null`. */
  mapaUrl: string | null;
}

/**
 * El otro lado de la conversación, ya resuelto por el backend: el cliente no tiene que
 * averiguar cuál de los dos participantes es "el otro" ni si es una persona o un refugio.
 */
export interface ContactoChat {
  /** Derivado por el backend a partir de si el chat tiene refugio; no es `chat_tipo`. */
  tipo: 'USUARIO' | 'REFUGIO';
  /** Id del usuario o del refugio, según `tipo`. **No** es el `chatId`. */
  id: number;
  nombre: string;
  /** Ruta relativa: pasarla por `urlAbsoluta` antes de renderizarla. */
  imagenUrl: string | null;
  /** `false` si la cuenta del contacto está dada de baja. El chat se muestra igual. */
  activo: boolean;
}

/** Un adjunto de un mensaje, tal como lo devuelve el backend. */
export interface AdjuntoMensaje {
  /** Ruta relativa: pasarla por `urlAbsoluta` antes de renderizarla. */
  url: string;
  tipo: TipoAdjunto;
}

export interface UltimoMensaje {
  /** Sin truncar: el recorte es visual, con `numberOfLines`. */
  contenido: string;
  /** ISO 8601 crudo. El texto relativo lo arma `tiempoRelativo`. */
  fecha: string;
  esMio: boolean;
  /** Con `contenido` vacío significa mensaje de sólo foto o sólo video. */
  tieneImagen: boolean;
  /** Ese adjunto es un video: el preview dice "Video" en vez de "Foto". */
  tieneVideo: boolean;
  /**
   * Todo lo que no es `TEXTO` es una tarjeta (una solicitud, un aviso reclamado, una mascota
   * compartida o la ubicación del refugio): el `contenido` va vacío y el texto lo pone la fila.
   */
  tipo: TipoMensaje;
  /** El autor lo eliminó: viene sin contenido y la fila dice "Se eliminó este mensaje". */
  eliminado: boolean;
}

export interface Conversacion {
  chatId: number;
  contacto: ContactoChat;
  /** `null` cuando la sala se creó pero todavía nadie escribió. */
  ultimoMensaje: UltimoMensaje | null;
  /** Mensajes del otro que el usuario no leyó. Absoluto, no un delta. */
  noLeidos: number;
  /** Clave de orden, nunca null: fecha del último mensaje o de creación del chat. */
  fechaUltimaActividad: string;
}

export interface ListaChats {
  /** Siempre coincide con `chats.length`. */
  total: number;
  chats: Conversacion[];
}

/**
 * La lista viene completa (no pagina) y **ya ordenada** por `fechaUltimaActividad`
 * descendente: no reordenar en el cliente.
 */
export function listarChats(): Promise<ListaChats> {
  return get('/chats');
}

// ─────────────── HU-5.2 · Sala de conversación (GUI-14) ───────────────

/**
 * La solicitud que originó la sala. La pinta la tarjeta embebida de la conversación y el
 * subtítulo de la cabecera.
 *
 * Es un resumen: para el detalle completo se navega a `/solicitudes/:id` con el `id`.
 */
export interface SolicitudEnChat {
  id: number;
  /** Quien la envió: decide de qué lado de la sala va la tarjeta. */
  usuarioId: number;
  /** "Adopcion" o "Transito", del catálogo del backend. */
  tipo: string;
  /** Estado vigente ("Pendiente", "Aceptada"…), resuelto al momento del pedido. */
  estado: string;
  /** ISO 8601 crudo: cuándo se envió. */
  fechaAlta: string;
  /** ISO crudo: cuándo se resolvió. Un backend anterior no lo manda. */
  fechaRespuesta?: string | null;
  /** El período ofrecido, solo en un tránsito (`AAAA-MM-DD`). */
  transito?: { fechaInicio: string; fechaFin: string } | null;
  mascota: {
    id: number;
    /** `null` si la mascota no tiene nombre cargado. */
    nombre: string | null;
    especie: string;
    /** Un backend anterior no lo manda: el texto cae al masculino. */
    genero?: Genero;
    /** ISO crudo o `null`. La edad la calcula el cliente. */
    fechaNacimiento: string | null;
    imagenUrl: string | null;
  };
}

/**
 * El aviso de mascota perdida/encontrada de una tarjeta de la conversación (HU-13.2).
 *
 * Es un resumen, no el aviso entero: el detalle completo sale del portal. **No trae
 * coordenadas ni distancia** — las del dispositivo no se exponen nunca y la distancia depende
 * de dónde está quien mira.
 */
export interface AvisoEnChat {
  id: number;
  /** `null` en un aviso "Encontrado" sin nombre: se muestra la especie en su lugar. */
  nombre: string | null;
  /** Del catálogo, o `null` en avisos cargados antes de HU-13.1. */
  especie: string | null;
  /** Estado vigente: "Perdido", "Encontrado" o "Resuelto", resuelto al momento del pedido. */
  estado: string;
  /** Portada del aviso. Ruta relativa o absoluta: siempre pasa por `urlAbsoluta`. */
  imagenUrl: string;
  /** Ya armada: «referencia, localidad - provincia». Puede ser `null`. */
  ubicacion: string | null;
  /** Sólo el día (`AAAA-MM-DD`), o `null`. */
  fechaSuceso: string | null;
  /** ISO 8601 crudo: cuándo se publicó el aviso. */
  fechaAlta: string;
}

/**
 * Un mensaje. **Misma forma en el historial, en la respuesta del envío y en el evento
 * `chat:mensaje-nuevo`**, así que hay un solo tipo y un solo mapper para los tres.
 */
export interface Mensaje {
  /** Clave de deduplicación contra el broadcast, y cursor de paginación. */
  id: number;
  chatId: number;
  /** Cadena vacía en un mensaje de sólo foto o en una tarjeta (`SOLICITUD`, `ANIMAL_PERDIDO`). */
  contenido: string;
  /** PRIMERA foto: es siempre `imagenes[0]`. Se conserva por compatibilidad. */
  imagenUrl: string | null;
  /** Todas las fotos, en orden. Rutas relativas: pasarlas por `urlAbsoluta`. */
  imagenes: string[];
  /**
   * Las MISMAS rutas de `imagenes`, cada una con su tipo ya resuelto por el backend.
   *
   * Es el campo a usar: desde que un mensaje puede llevar video, `imagenes` dejó de describir
   * lo que trae. El cliente **no** deduce el tipo de la extensión — lo recibe, igual que
   * recibe el contacto del listado ya resuelto.
   */
  adjuntos: AdjuntoMensaje[];
  /** Id del emisor. El backend NO manda `esMio`: se compara con la sesión. */
  usuarioId: number;
  /**
   * `SOLICITUD` es la tarjeta que deja PetHood al enviarse una solicitud y
   * `ANIMAL_PERDIDO` la del aviso reclamado (HU-13.2): su emisor es el usuario SISTEMA, que no
   * participa de la sala. `MASCOTA` y `UBICACION_REFUGIO` también son tarjetas, pero las manda
   * una persona: van de su lado y las puede eliminar. Ninguna es una burbuja.
   */
  tipo: TipoMensaje;
  /**
   * Le llegó al destinatario aunque no lo haya abierto: el segundo tilde.
   *
   * Ojo con la semántica: `entregado` y `leido` responden "¿lo recibió/leyó su
   * destinatario?". En un mensaje AJENO el destinatario sos vos, así que sólo tienen
   * sentido en los propios — que es donde el diseño los pinta.
   */
  entregado: boolean;
  /** El destinatario lo leyó: el doble tilde pintado. */
  leido: boolean;
  /** Cuándo lo leyó, ISO crudo, o `null`. Todos los cubiertos por una lectura comparten hora. */
  fechaLectura: string | null;
  /** Sólo en los de `tipo: 'SOLICITUD'`. */
  solicitud: SolicitudEnChat | null;
  /** Sólo en los de `tipo: 'ANIMAL_PERDIDO'` (HU-13.2). */
  aviso: AvisoEnChat | null;
  /** Sólo en los de `tipo: 'MASCOTA'`: la mascota compartida. */
  mascota: MascotaEnChat | null;
  /** Sólo en los de `tipo: 'UBICACION_REFUGIO'`: la ubicación del refugio de la sala. */
  ubicacion: UbicacionRefugioEnChat | null;
  /**
   * El autor lo eliminó. Sigue en el historial pero viene vacío —sin texto, adjuntos ni cita—:
   * en su lugar se pinta "Se eliminó este mensaje".
   */
  eliminado: boolean;
  /** El mensaje al que éste responde, resumido para la cita, o `null`. */
  respondeA: MensajeCitado | null;
  /** ISO 8601 crudo. La hora la arma `horaVisible`. */
  fechaAlta: string;
}

/** Lo que la burbuja que responde muestra del mensaje citado. */
export interface MensajeCitado {
  id: number;
  /** Autor del citado: se compara con la sesión para decir "Vos" o el nombre del contacto. */
  usuarioId: number;
  /** Sin truncar. Vacío si era sólo adjuntos o si se eliminó. */
  contenido: string;
  /**
   * Qué adjuntos llevaba, o `null`. `miniaturaUrl` es la primera foto (ruta relativa: pasarla
   * por `urlAbsoluta`); un video no tiene miniatura.
   */
  adjunto: { tipo: TipoAdjunto; cantidad: number; miniaturaUrl: string | null } | null;
  /** El citado se eliminó después: la cita lo dice y no muestra lo que decía. */
  eliminado: boolean;
}

/** Respuesta de eliminar un mensaje, igual al payload de `chat:mensaje-eliminado`. */
export interface MensajeEliminado {
  chatId: number;
  mensajeId: number;
}

export interface HistorialMensajes {
  /** DESCENDENTE: `mensajes[0]` es el más reciente. Alimenta una lista invertida tal cual. */
  mensajes: Mensaje[];
  hayMas: boolean;
  /** Id a mandar como `antesDe` para la página siguiente. `null` en el principio del chat. */
  proximoCursor: number | null;
}

export interface CabeceraChat {
  chatId: number;
  contacto: ContactoChat;
  /** Snapshot de presencia. A partir de acá lo actualiza el evento `chat:presencia`. */
  enLinea: boolean;
  /**
   * En cuántos MINUTOS suele responder el contacto, o `null` si todavía no hay tendencia.
   * El texto ("responde en ~2 h") lo arma el cliente.
   */
  minutosRespuesta: number | null;
  /** La solicitud vigente de la sala, o `null` si no hay ninguna. */
  solicitud: SolicitudEnChat | null;
  /**
   * El aviso de la última tarjeta de aviso de la sala (HU-13.2), o `null`.
   *
   * **No es excluyente con `solicitud`**: desde que el reclamo entra en la conversación que ya
   * existía con esa persona, una sala puede tener las dos tarjetas.
   */
  aviso: AvisoEnChat | null;
  /**
   * De cuál de las dos tarjetas se está hablando: la más reciente, o `null` si no hay ninguna.
   * Alimenta el subtítulo de la cabecera.
   *
   * Lo decide el backend para que la pantalla no tenga que comparar fechas ni conocer la regla.
   */
  contexto: 'SOLICITUD' | 'ANIMAL_PERDIDO' | null;
}

export interface ResultadoLeidos {
  chatId: number;
  /** Siempre 0: sirve para actualizar el ítem del listado sin refetch. */
  noLeidos: number;
  /** Cuántos cambiaron de verdad. 0 al reabrir una sala ya leída. */
  marcados: number;
}

export interface ResultadoEntregados {
  chatId: number;
  /** Cuántos pasaron a entregados. 0 al reacusar lo ya acusado. */
  marcados: number;
  /** Hasta qué fecha quedó acusada la sala, ISO crudo, o `null` si no había nada. */
  hasta: string | null;
}

/** Cabecera de GUI-14: contacto ya resuelto y presencia, sin depender del listado. */
export function obtenerCabeceraChat(chatId: number): Promise<CabeceraChat> {
  return get(`/chats/${chatId}`);
}

/**
 * Una página del historial. Sin `antesDe` trae la más reciente; con él, la anterior.
 *
 * El backend ya devuelve los mensajes ordenados: **no reordenar ni invertir acá**.
 */
export function listarMensajes(chatId: number, antesDe?: number): Promise<HistorialMensajes> {
  const query = antesDe === undefined ? '' : `?antesDe=${antesDe}`;
  return get(`/chats/${chatId}/mensajes${query}`);
}

/**
 * Envía un mensaje. Devuelve el mensaje YA persistido, con su id y su fecha definitivos.
 *
 * Va por REST y no por socket: así el envío funciona aunque el websocket esté caído, y las
 * fotos reusan el multipart por XHR que el resto de la app ya usa. Con fotos va multipart;
 * sin fotos, JSON — mandar multipart para un texto suelto sería armar un formulario al
 * pedo.
 *
 * Los adjuntos viajan **repitiendo el campo `foto`**, que es como multipart expresa una
 * lista y lo que el backend espera. El campo se sigue llamando `foto` aunque también acepte
 * un video: es el nombre del contrato, y renombrarlo obligaría a versionar el endpoint. El
 * orden en que se agregan es el que se ve en la grilla.
 *
 * `respondeAId` es el mensaje que se cita al deslizar para responder. Que sea de esta sala lo
 * valida el backend.
 */
export async function enviarMensaje(
  chatId: number,
  contenido: string,
  adjuntos: ArchivoAdjunto[] = [],
  respondeAId: number | null = null,
): Promise<Mensaje> {
  if (adjuntos.length === 0) {
    return post(`/chats/${chatId}/mensajes`, {
      contenido,
      ...(respondeAId === null ? {} : { respondeAId }),
    });
  }

  const formData = new FormData();
  formData.append('contenido', contenido);
  if (respondeAId !== null) formData.append('respondeAId', String(respondeAId));

  for (const adjunto of adjuntos) {
    await adjuntarArchivo(formData, 'foto', adjunto);
  }

  return postFormData(`/chats/${chatId}/mensajes`, formData);
}

/**
 * Elimina un mensaje propio, para los dos: en la conversación queda el aviso "Se eliminó este
 * mensaje". Es una baja lógica del lado del servidor, sin límite de tiempo.
 */
export function eliminarMensaje(chatId: number, mensajeId: number): Promise<MensajeEliminado> {
  return del(`/chats/${chatId}/mensajes/${mensajeId}`);
}

/**
 * Las mascotas que se pueden compartir en esta sala. Como persona, las que el usuario tiene en
 * favoritos y son de su contacto (de ese refugio, o personales de esa persona); como refugio,
 * las mascotas publicadas del refugio. La regla la decide el backend mirando la sala.
 */
export function listarMascotasCompartibles(chatId: number): Promise<{ mascotas: MascotaEnChat[] }> {
  return get(`/chats/${chatId}/mascotas-compartibles`);
}

/** Comparte una mascota: devuelve el mensaje de la tarjeta, ya persistido. */
export function compartirMascota(chatId: number, mascotaId: number): Promise<Mensaje> {
  return post(`/chats/${chatId}/mascotas`, { mascotaId });
}

/**
 * Lo que mandaría el refugio como ubicación, para el diálogo que pregunta antes. Responde
 * `REFUGIO_SIN_UBICACION` si el perfil del refugio no tiene ni dirección ni link de Maps.
 */
export function obtenerUbicacionRefugio(chatId: number): Promise<UbicacionRefugioEnChat> {
  return get(`/chats/${chatId}/ubicacion-refugio`);
}

/** Manda la ubicación del refugio: devuelve el mensaje de la tarjeta, ya persistido. */
export function enviarUbicacionRefugio(chatId: number): Promise<Mensaje> {
  return post(`/chats/${chatId}/ubicacion-refugio`, {});
}

/** Marca leída la conversación entera. Se llama al abrir la sala, no por mensaje visto. */
export function marcarChatLeido(chatId: number): Promise<ResultadoLeidos> {
  return post(`/chats/${chatId}/leidos`, {});
}

/**
 * Acusa que los mensajes de la sala LLEGARON, aunque no se haya abierto: el segundo tilde.
 *
 * Se llama apenas entra un mensaje por socket, se esté donde se esté. Es de sala y no de
 * mensaje, así que con una llamada alcanza para una ráfaga entera.
 */
export function marcarChatEntregado(chatId: number): Promise<ResultadoEntregados> {
  return post(`/chats/${chatId}/entregados`, {});
}
