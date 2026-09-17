/**
 * Chat: listado de conversaciones (HU-5.1) y sala (HU-5.2). Contratos en
 * `pethood-backend/docs/api-chats.md` y `api-chat-sala.md`.
 */
import { adjuntarArchivo, get, post, postFormData, type ArchivoAdjunto } from './api';

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

export interface UltimoMensaje {
  /** Sin truncar: el recorte es visual, con `numberOfLines`. */
  contenido: string;
  /** ISO 8601 crudo. El texto relativo lo arma `tiempoRelativo`. */
  fecha: string;
  esMio: boolean;
  /** Con `contenido` vacío significa mensaje de sólo foto. */
  tieneImagen: boolean;
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
 * Un mensaje. **Misma forma en el historial, en la respuesta del envío y en el evento
 * `chat:mensaje-nuevo`**, así que hay un solo tipo y un solo mapper para los tres.
 */
export interface Mensaje {
  /** Clave de deduplicación contra el broadcast, y cursor de paginación. */
  id: number;
  chatId: number;
  /** Cadena vacía en un mensaje de sólo foto. */
  contenido: string;
  /** Ruta relativa: pasarla por `urlAbsoluta`. `null` si el mensaje es sólo texto. */
  imagenUrl: string | null;
  /** Id del emisor. El backend NO manda `esMio`: se compara con la sesión. */
  usuarioId: number;
  leido: boolean;
  /** ISO 8601 crudo. La hora la arma `horaVisible`. */
  fechaAlta: string;
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
}

export interface ResultadoLeidos {
  chatId: number;
  /** Siempre 0: sirve para actualizar el ítem del listado sin refetch. */
  noLeidos: number;
  /** Cuántos cambiaron de verdad. 0 al reabrir una sala ya leída. */
  marcados: number;
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
 * Va por REST y no por socket: así el envío funciona aunque el websocket esté caído, y la
 * foto reusa el multipart por XHR que el resto de la app ya usa. Con foto va multipart;
 * sin foto, JSON — mandar multipart para un texto suelto sería armar un formulario al
 * pedo.
 */
export async function enviarMensaje(
  chatId: number,
  contenido: string,
  foto?: ArchivoAdjunto | null,
): Promise<Mensaje> {
  if (!foto) {
    return post(`/chats/${chatId}/mensajes`, { contenido });
  }

  const formData = new FormData();
  formData.append('contenido', contenido);
  await adjuntarArchivo(formData, 'foto', foto);

  return postFormData(`/chats/${chatId}/mensajes`, formData);
}

/** Marca leída la conversación entera. Se llama al abrir la sala, no por mensaje visto. */
export function marcarChatLeido(chatId: number): Promise<ResultadoLeidos> {
  return post(`/chats/${chatId}/leidos`, {});
}
