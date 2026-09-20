/**
 * Estado del listado de conversaciones (HU-5.1, GUI-08 / GUI-31): carga, refresco y tiempo
 * real.
 *
 * Antes la pantalla sólo recargaba al tomar el foco, así que un mensaje que llegaba con el
 * listado abierto no movía el badge hasta salir y volver a entrar. Ahora escucha el socket:
 * `chat:mensaje-nuevo` viaja a la sala PERSONAL del usuario justamente para esto (ver
 * `api-chat-sala.md`), y `chat:no-leidos` baja el badge cuando la sala se marca como leída.
 *
 * Es el mismo socket compartido que usa la sala (`adquirirSocket`): esta pantalla es una tab
 * y vive todo el tiempo que dura la sesión, así que mantiene la conexión abierta aunque no
 * haya ninguna conversación abierta. Las transformaciones de la lista son funciones puras
 * en `lib/listaChats.ts`.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSesion } from '@/hooks/useSesion';
import { aplicarMensajeNuevo, aplicarNoLeidos, conoceChat } from '@/lib/listaChats';
import { EVENTOS, adquirirSocket, type EventoNoLeidos } from '@/lib/socketChat';
import {
  listarChats,
  marcarChatEntregado,
  type Conversacion,
  type Mensaje,
} from '@/services/chats';

const MENSAJE_ERROR_CARGA = 'No pudimos cargar tus conversaciones.';

export interface EstadoListaChats {
  /** Ya ordenada por actividad descendente, igual que la devuelve el servidor. */
  chats: Conversacion[];
  cargando: boolean;
  /** `true` durante el pull-to-refresh. */
  refrescando: boolean;
  error: string | null;
  /** Reintento del estado de error: vuelve a mostrar el spinner de pantalla completa. */
  recargar: () => void;
  /** Pull-to-refresh: recarga sin sacar la lista de la pantalla. */
  refrescar: () => void;
}

export function useListaChats(): EstadoListaChats {
  const { usuario, token } = useSesion();
  const miUsuarioId = usuario?.id ?? 0;

  const [chats, setChats] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  /** Espejo de `chats` para consultarlo desde los listeners del socket sin recrearlos. */
  const chatsRef = useRef<Conversacion[]>([]);
  chatsRef.current = chats;

  /**
   * Trae el listado. En modo silencioso (refetch por un evento o una reconexión) no toca ni
   * el error ni el spinner: la lista que ya se ve sigue estando, y si falla el usuario la
   * refresca a mano o se corrige sola al volver a enfocar la pantalla.
   */
  const cargar = useCallback(async (opciones: { silencioso?: boolean } = {}): Promise<void> => {
    try {
      if (!opciones.silencioso) setError(null);

      const respuesta = await listarChats();

      if (!montado.current) return;
      setChats(respuesta.chats);
    } catch (err) {
      if (!montado.current || opciones.silencioso) return;
      setError(err instanceof Error ? err.message : MENSAJE_ERROR_CARGA);
    } finally {
      if (montado.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, []);

  // Al volver de una conversación cambiaron los no leídos y el último mensaje. El socket ya
  // debería haberlo reflejado, pero la fuente de verdad es la base: se recarga igual cada
  // vez que la pantalla toma el foco, por si algún evento se perdió.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  // ─── Tiempo real ───
  useEffect(() => {
    if (!token) return;

    const { socket, liberar } = adquirirSocket(token);

    // El server no encola nada de lo que pasó con el socket caído: al reconectar se vuelve
    // a pedir la lista. En la primera conexión no hace falta, la carga del foco ya está en
    // vuelo.
    let conectoAntes = socket.connected;

    const alConectar = (): void => {
      if (conectoAntes) void cargar({ silencioso: true });
      conectoAntes = true;
    };

    const alMensajeNuevo = (mensaje: Mensaje): void => {
      if (!montado.current) return;

      // Acuse de recibo: es el segundo tilde en la pantalla de quien escribió. Va acá y no
      // sólo en la sala porque esta pestaña vive toda la sesión: es la que garantiza que
      // "le llegó" se acuse aunque el usuario esté en cualquier otra pantalla. La sala lo
      // vuelve a mandar si está abierta, y el backend ignora el segundo.
      if (mensaje.usuarioId !== miUsuarioId) {
        void marcarChatEntregado(mensaje.chatId).catch(() => undefined);
      }

      // Una sala que el listado no conoce es un chat recién creado: la fila necesita el
      // contacto resuelto y eso sólo lo tiene el servidor.
      if (!conoceChat(chatsRef.current, mensaje.chatId)) {
        void cargar({ silencioso: true });
        return;
      }

      setChats((actuales) => aplicarMensajeNuevo(actuales, mensaje, miUsuarioId));
    };

    const alNoLeidos = (evento: EventoNoLeidos): void => {
      if (!montado.current) return;
      setChats((actuales) => aplicarNoLeidos(actuales, evento));
    };

    socket.on('connect', alConectar);
    socket.on(EVENTOS.MENSAJE_NUEVO, alMensajeNuevo);
    socket.on(EVENTOS.NO_LEIDOS, alNoLeidos);

    return () => {
      socket.off('connect', alConectar);
      socket.off(EVENTOS.MENSAJE_NUEVO, alMensajeNuevo);
      socket.off(EVENTOS.NO_LEIDOS, alNoLeidos);
      liberar();
    };
  }, [token, miUsuarioId, cargar]);

  const recargar = useCallback((): void => {
    setCargando(true);
    void cargar();
  }, [cargar]);

  const refrescar = useCallback((): void => {
    setRefrescando(true);
    void cargar();
  }, [cargar]);

  return { chats, cargando, refrescando, error, recargar, refrescar };
}
