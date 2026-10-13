/**
 * Push notifications (spec 004). Pide permiso y genera el token de Expo — nunca corta el
 * flujo de login si el usuario no lo otorga o si Expo Go no lo soporta (regla 11: la bandeja
 * sigue funcionando igual).
 *
 * OJO: desde el SDK 53 de Expo, Expo Go no entrega push remoto — hace falta una
 * development build (`eas build --profile development` o `expo run:android`/`run:ios`). En
 * Expo Go esta función devuelve `null` sin romper nada. En Expo Go para Android el paquete
 * directamente no se carga: ver `lib/expoNotificaciones.ts`.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { Notificaciones } from '@/lib/expoNotificaciones';

Notificaciones?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface DispositivoPush {
  expoPushToken: string;
  plataforma: 'ios' | 'android';
}

/**
 * Pide permiso (si todavía no se decidió) y arma el token de push. `null` si: no es un
 * dispositivo físico, no se otorgó permiso, es web, o falta el projectId de EAS (Expo Go sin
 * development build).
 */
export async function pedirPermisoYObtenerDispositivo(): Promise<DispositivoPush | null> {
  if (!Notificaciones || Platform.OS === 'web' || !Device.isDevice) return null;

  const actual = await Notificaciones.getPermissionsAsync();
  let estado = actual.status;

  if (estado !== 'granted') {
    const pedido = await Notificaciones.requestPermissionsAsync();
    estado = pedido.status;
  }

  if (estado !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;

  try {
    const { data: expoPushToken } = await Notificaciones.getExpoPushTokenAsync({ projectId });
    return { expoPushToken, plataforma: Platform.OS === 'ios' ? 'ios' : 'android' };
  } catch (err) {
    console.warn('No se pudo generar el token de push', err);
    return null;
  }
}
