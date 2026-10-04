/**
 * Contador de no leídas de la campana (spec 004), en vivo por el mismo socket compartido que
 * usa el chat: el server manda `notificacion:contador` recalculado a la sala personal cada
 * vez que cambia (nueva notificación, marcada como leída, todas leídas). Con el socket caído
 * (o mientras conecta) el número mostrado es el de la última carga por HTTP.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSesion } from '@/hooks/useSesion';
import { adquirirSocket, EVENTOS, type EventoNotificacionContador } from '@/lib/socketChat';
import { contarNoLeidas } from '@/services/notificaciones';

export function useNotificaciones(): { noLeidas: number } {
  const { token, autenticado } = useSesion();
  const [noLeidas, setNoLeidas] = useState(0);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const { contador } = await contarNoLeidas();
      if (montado.current) setNoLeidas(contador);
    } catch {
      // Sin conexión se queda con el último valor conocido; no hay error que mostrar acá.
    }
  }, []);

  useEffect(() => {
    if (!autenticado) {
      setNoLeidas(0);
      return;
    }
    void cargar();
  }, [autenticado, cargar]);

  useEffect(() => {
    if (!token) return;

    const { socket, liberar } = adquirirSocket(token);

    const alConectar = (): void => void cargar();
    const alContador = (evento: EventoNotificacionContador): void => {
      if (montado.current) setNoLeidas(evento.contador);
    };

    socket.on('connect', alConectar);
    socket.on(EVENTOS.NOTIFICACION_CONTADOR, alContador);

    return () => {
      socket.off('connect', alConectar);
      socket.off(EVENTOS.NOTIFICACION_CONTADOR, alContador);
      liberar();
    };
  }, [token, cargar]);

  return { noLeidas };
}
