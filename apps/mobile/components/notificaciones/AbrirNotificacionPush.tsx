/**
 * Lleva a la pantalla que corresponde cuando la persona toca un push (spec 004). Anda también
 * si la app estaba cerrada: `useLastNotificationResponse` entrega la notificación que la abrió.
 *
 * Sin una pantalla razonable para ese aviso, abre la bandeja.
 *
 * Donde no hay paquete de notificaciones (Expo Go para Android, ver `lib/expoNotificaciones.ts`)
 * no hay push que tocar y no se monta nada. Por eso el trabajo vive en un componente aparte: el
 * hook del paquete no se puede llamar condicionalmente.
 */
import { useRouter } from 'expo-router';
import { useEffect, useRef, type ReactElement } from 'react';
import { Platform } from 'react-native';

import { useSesion } from '@/hooks/useSesion';
import { Notificaciones } from '@/lib/expoNotificaciones';
import { rutaDeNotificacion } from '@/lib/rutaDeNotificacion';

type ModuloNotificaciones = NonNullable<typeof Notificaciones>;

function EscucharToquePush({ notificaciones }: { notificaciones: ModuloNotificaciones }): null {
  const router = useRouter();
  const { autenticado, cargando } = useSesion();
  const respuesta = notificaciones.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);

  useEffect(() => {
    // Sin sesión no hay a dónde ir: el stack protegido todavía no está montado.
    if (Platform.OS === 'web' || !respuesta || !autenticado || cargando) return;
    if (respuesta.actionIdentifier !== notificaciones.DEFAULT_ACTION_IDENTIFIER) return;

    const id = respuesta.notification.request.identifier;
    if (atendida.current === id) return;
    atendida.current = id;

    const datos = respuesta.notification.request.content.data as
      { entidadTipo?: string | null; entidadId?: number | null } | undefined;

    const ruta = rutaDeNotificacion(datos?.entidadTipo, datos?.entidadId);

    router.push((ruta ?? { pathname: '/notificaciones' }) as never);
  }, [respuesta, router, autenticado, cargando, notificaciones]);

  return null;
}

export function AbrirNotificacionPush(): ReactElement | null {
  // En web el hook lanza `getLastNotificationResponse is not available on web`: no se monta.
  if (Platform.OS === 'web') return null;
  return Notificaciones ? <EscucharToquePush notificaciones={Notificaciones} /> : null;
}
