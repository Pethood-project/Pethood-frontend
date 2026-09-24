/**
 * Lógica del listado de conversaciones: los eventos de tiempo real (HU-5.1) y el filtro por
 * nombre de contacto (HU-5.3). Funciones puras: el hook `useListaChats` se ocupa de los
 * efectos y la pantalla de pintar, acá sólo se transforman datos.
 *
 * El backend manda `chat:mensaje-nuevo` a la sala PERSONAL del usuario justamente para que
 * lo reciba quien está mirando el listado sin la conversación abierta (ver
 * `api-chat-sala.md`). El payload es el mensaje entero, y de él sale todo lo que necesita
 * la fila: preview, "Vos:", si trae foto, el badge y la clave de orden. Con eso el listado se
 * actualiza en memoria sin volver a pedir `GET /chats`.
 */
import type { Conversacion, Mensaje } from '@/services/chats';
import type { EventoNoLeidos } from '@/lib/socketChat';
// Con extensión y ruta relativa a propósito: es la única forma de que `node --test` pueda
// cargar este módulo para testear `filtrarPorContacto` sin pasar por Metro.
import { normalizarParaBusqueda } from './texto.ts';

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
      // Un mensaje no mezcla fotos con video, así que el tipo del primer adjunto es el del
      // mensaje entero — el mismo criterio con el que el backend arma este preview.
      tieneVideo: mensaje.adjuntos[0]?.tipo === 'VIDEO',
      tipo: mensaje.tipo,
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

/**
 * Filtra el listado por el nombre del contacto (HU-5.3).
 *
 * Es una **vista** sobre la lista, no una modificación: devuelve un array nuevo con un
 * subconjunto de las mismas referencias, y quien la llama conserva la lista completa. Al
 * vaciar el término vuelven todas las conversaciones, en su orden original, porque nunca se
 * fueron de ninguna parte.
 *
 * - **Coincidencia parcial**, en cualquier posición del nombre: `"pat"` encuentra
 *   `"Refugio Patitas"`.
 * - **Insensible a mayúsculas y a tildes**: las dos puntas pasan por
 *   `normalizarParaBusqueda`.
 * - **Espacios de los extremos ignorados.** Un término vacío, o de puros espacios, devuelve
 *   la lista entera: "no filtrar" y "buscar nada" son lo mismo.
 *
 * El **orden se mantiene solo**: `filter` respeta el de entrada, y la entrada ya viene
 * ordenada por `fechaUltimaActividad` descendente. Por eso el filtro se aplica siempre sobre
 * la lista completa recién ordenada y nunca sobre un resultado anterior: un mensaje que
 * llega por socket reordena la lista de abajo y esta función vuelve a recortarla, así que
 * dentro de los resultados el orden por último mensaje sigue valiendo y una conversación que
 * no coincide no se cuela aunque acabe de recibir un mensaje.
 *
 * Se compara contra `contacto.nombre`, que es exactamente el texto que muestra cada fila:
 * el usuario busca lo que ve.
 */
export function filtrarPorContacto(chats: Conversacion[], termino: string): Conversacion[] {
  const buscado = normalizarParaBusqueda(termino);
  if (!buscado) return chats;

  return chats.filter((chat) => normalizarParaBusqueda(chat.contacto.nombre).includes(buscado));
}
