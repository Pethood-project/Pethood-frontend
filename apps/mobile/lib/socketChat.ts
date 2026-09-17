/**
 * Conexión de websocket con el backend (HU-5.2). Contrato en
 * `pethood-backend/docs/api-chat-sala.md`.
 *
 * Es UNA sola conexión para toda la app, con conteo de referencias: cada pantalla que la
 * necesita llama a `adquirirSocket` y devuelve la función que la libera. Cuando el último
 * la suelta, se desconecta.
 *
 * Es así y no una conexión por pantalla porque `chat:mensaje-nuevo` viaja a la sala
 * PERSONAL del usuario, no a la del chat: sirve igual para la sala abierta (HU-5.2) y para
 * el badge del listado (HU-5.1) o las notificaciones (HU-4.3). Abrir y cerrar un socket en
 * cada navegación desaprovecharía eso y además haría un handshake por pantalla.
 *
 * El socket es de SÓLO LECTURA: enviar un mensaje es un POST REST. Lo único que sale de
 * acá son `chat:unirse` y `chat:salir`, que apenas dicen a qué sala escuchar.
 */
import { io, type Socket } from 'socket.io-client';

import { URL_BASE } from '@/services/api';

/** Nombres exactos del contrato. Un typo acá no falla: simplemente no llega nada. */
export const EVENTOS = {
  UNIRSE: 'chat:unirse',
  SALIR: 'chat:salir',
  MENSAJE_NUEVO: 'chat:mensaje-nuevo',
  LEIDO: 'chat:leido',
  NO_LEIDOS: 'chat:no-leidos',
  PRESENCIA: 'chat:presencia',
  ERROR: 'chat:error',
} as const;

/** Respuesta de los eventos que el cliente emite. El error tiene la forma de la API REST. */
export type Ack<T> =
  | { ok: true; datos: T }
  | { ok: false; error: { codigo: string; mensaje: string } };

export interface EventoLeido {
  chatId: number;
  /** Quién leyó. Si no sos vos, tus mensajes de esa sala pasan a leídos. */
  usuarioId: number;
}

export interface EventoNoLeidos {
  chatId: number;
  noLeidos: number;
}

export interface EventoPresencia {
  chatId: number;
  usuarioId: number;
  enLinea: boolean;
}

export interface EventoError {
  error: { codigo: string; mensaje: string };
}

let socket: Socket | null = null;
let referencias = 0;

/**
 * Abre la conexión (o reusa la abierta) y devuelve el socket junto con su liberador.
 *
 * `transports: ['websocket']` a propósito: el long-polling de socket.io en React Native es
 * frágil y, cuando funciona, agrega un upgrade que sólo retrasa la primera conexión. El
 * fallback tiene sentido en un navegador con proxies de por medio, no en la app.
 */
export function adquirirSocket(token: string): { socket: Socket; liberar: () => void } {
  if (!socket) {
    socket = io(URL_BASE, {
      auth: { token },
      transports: ['websocket'],
      // Sin esto el socket intentaría conectarse antes de que la pantalla registre sus
      // listeners, y el primer evento se perdería.
      autoConnect: false,
    });

    socket.connect();
  }

  referencias += 1;
  const actual = socket;

  let liberado = false;

  return {
    socket: actual,
    liberar: () => {
      // Un desmontaje puede dispararse dos veces (StrictMode, remontajes de Expo Router):
      // sin esta guarda el contador quedaría en negativo y la conexión nunca se cerraría.
      if (liberado) return;
      liberado = true;

      referencias = Math.max(0, referencias - 1);

      if (referencias === 0) {
        actual.disconnect();
        if (socket === actual) socket = null;
      }
    },
  };
}

/**
 * Cierra la conexión pase lo que pase. Es para el cierre de sesión: el socket quedó
 * autenticado con un token que ya no vale, así que no alcanza con soltar una referencia.
 */
export function cerrarSocket(): void {
  socket?.disconnect();
  socket = null;
  referencias = 0;
}
