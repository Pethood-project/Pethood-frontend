/**
 * Lleva a la pantalla que corresponde cuando la persona toca un push (spec 004). Anda también
 * si la app estaba cerrada: `useLastNotificationResponse` entrega la notificación que la abrió.
 *
 * Sin una pantalla razonable para ese aviso, abre la bandeja.
 */
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useSesion } from '@/hooks/useSesion';
import { rutaDeNotificacion } from '@/lib/rutaDeNotificacion';

export function AbrirNotificacionPush(): null {
  const router = useRouter();
  const { autenticado, cargando } = useSesion();
  const respuesta = Notifications.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);

  useEffect(() => {
    // Sin sesión no hay a dónde ir: el stack protegido todavía no está montado.
    if (Platform.OS === 'web' || !respuesta || !autenticado || cargando) return;
    if (respuesta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = respuesta.notification.request.identifier;
    if (atendida.current === id) return;
    atendida.current = id;

    const datos = respuesta.notification.request.content.data as
      { entidadTipo?: string | null; entidadId?: number | null } | undefined;

    const ruta = rutaDeNotificacion(datos?.entidadTipo, datos?.entidadId);

    router.push((ruta ?? { pathname: '/notificaciones' }) as never);
  }, [respuesta, router, autenticado, cargando]);

  return null;
}
