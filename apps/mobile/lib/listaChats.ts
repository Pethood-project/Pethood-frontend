/**
 * Lógica del listado de conversaciones (HU-5.1) cuando llegan eventos de tiempo real.
 * Funciones puras: el hook `useListaChats` se ocupa de los efectos, acá sólo se transforman
 * datos.
 *
 * El backend manda `chat:mensaje-nuevo` a la sala PERSONAL del usuario justamente para que
 * lo reciba quien está mirando el listado sin la conversación abierta (ver
 * `api-chat-sala.md`). El payload es el mensaje entero, y de él sale todo lo que necesita
 * la fila: preview, "Vos:", si trae foto, el badge y la clave de orden. Con eso el listado se
 * actualiza en memoria sin volver a pedir `GET /chats`.
 */
import type { Conversacion, Mensaje } from '@/services/chats';
import type { EventoNoLeidos } from '@/lib/socketChat';

/** Mismo orden que devuelve el servidor: más reciente primero. */
function porActividad(a: Conversacion, b: Conversacion): number {
  return Date.parse(b.fechaUltimaActividad) - Date.parse(a.fechaUltimaActividad);
}

/** `true` si el listado ya conoce esa sala. Si no, hay que refetchear: es un chat nuevo. */
export function conoceChat(chats: Conversacion[], chatId: number): boolean {
  return chats.some((chat) => chat.chatId === chatId);
}

/**
 * Aplica un `chat:mensaje-nuevo` a la fila de su conversación y la sube al tope.
 *
 * El badge sólo crece con mensajes AJENOS: `noLeidos` cuenta mensajes del otro, y el
 * broadcast le llega también al emisor (por diseño, para sincronizar sus dispositivos).
 *
 * Un mensaje que no es más nuevo que el preview actual se ignora: pasa al reconectar,
 * cuando el refetch del listado y los eventos que quedaron encolados se superponen. Sin
 * esta guarda el badge contaría dos veces el mismo mensaje.
 *
 * Si la sala no está en la lista devuelve la lista sin tocar — el hook detecta ese caso con
 * `conoceChat` y refetchea, porque una fila nueva necesita el contacto resuelto y eso sólo
 * lo tiene el servidor.
 */
export function aplicarMensajeNuevo(
  chats: Conversacion[],
  mensaje: Mensaje,
  miUsuarioId: number,
): Conversacion[] {
  const actual = chats.find((chat) => chat.chatId === mensaje.chatId);
  if (!actual) return chats;

  if (
    actual.ultimoMensaje &&
    Date.parse(mensaje.fechaAlta) <= Date.parse(actual.ultimoMensaje.fecha)
  ) {
    return chats;
  }

  const esMio = mensaje.usuarioId === miUsuarioId;

  const actualizado: Conversacion = {
    ...actual,
    ultimoMensaje: {
      contenido: mensaje.contenido,
      fecha: mensaje.fechaAlta,
      esMio,
      tieneImagen: mensaje.imagenUrl !== null,
    },
    noLeidos: esMio ? actual.noLeidos : actual.noLeidos + 1,
    fechaUltimaActividad: mensaje.fechaAlta,
  };

  return chats
    .map((chat) => (chat.chatId === mensaje.chatId ? actualizado : chat))
    .sort(porActividad);
}

/**
 * Aplica un `chat:no-leidos`: el contador absoluto de una sala, que el backend manda cuando
 * el usuario la marcó como leída (desde este u otro dispositivo).
 */
export function aplicarNoLeidos(chats: Conversacion[], evento: EventoNoLeidos): Conversacion[] {
  const actual = chats.find((chat) => chat.chatId === evento.chatId);
  if (!actual || actual.noLeidos === evento.noLeidos) return chats;

  return chats.map((chat) =>
    chat.chatId === evento.chatId ? { ...chat, noLeidos: evento.noLeidos } : chat,
  );
}
