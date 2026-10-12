/**
 * `expo-notifications`, o `null` donde el paquete no se puede cargar. Es la única puerta al
 * paquete: nadie más lo importa directo.
 *
 * **Por qué no es un `import` común.** En Expo Go para Android el paquete ni siquiera se puede
 * importar: al cargarse corre `DevicePushTokenAutoRegistration.fx`, que registra un listener del
 * token de push, y desde el SDK 53 eso TIRA un error (Expo Go ya no entrega push remoto en
 * Android). Con un `import` arriba de todo, el error rompía cualquier pantalla que importara
 * `useSesion` —o sea, todas— y Expo Router las reportaba como "missing the required default
 * export".
 *
 * Así, en Expo Go para Android la app anda sin push, que es lo mismo que pasaba de todos modos:
 * la bandeja sigue funcionando (spec 004, regla 11). En una development build, en el APK y en
 * iOS el paquete se carga normal.
 */
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type ModuloNotificaciones = typeof import('expo-notifications');

export const Notificaciones: ModuloNotificaciones | null =
  Platform.OS === 'android' && isRunningInExpoGo()
    ? null
    : (require('expo-notifications') as ModuloNotificaciones);
