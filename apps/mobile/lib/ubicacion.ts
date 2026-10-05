/**
 * Acceso a la geolocalización del dispositivo (Módulo 11, HU-11.3).
 *
 * Pide permiso de primer plano y devuelve las coordenadas actuales, o el motivo por el que no
 * se pudieron obtener (denegado, GPS apagado, error). El llamador NUNCA debe bloquear una
 * pantalla por esto: sin coordenadas, la distancia o el filtro por cercanía simplemente no se
 * muestran.
 *
 * No hay SDK de mapas ni geocodificación: las coordenadas se usan solo para calcular distancia
 * contra la ubicación de las publicaciones/refugios.
 */
import * as Location from 'expo-location';

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

/** Resultado de pedir la ubicación, con el motivo cuando no se pudo obtener. */
export type ResultadoUbicacion =
  | { ok: true; coordenadas: Coordenadas }
  | { ok: false; motivo: 'DENEGADO' | 'DESACTIVADO' | 'ERROR' };

/**
 * Última ubicación conocida de la sesión. Evita volver a pedir permiso o leer el GPS cada vez
 * que una pantalla necesita la distancia; se refresca a pedido con `forzar`.
 */
let ultimasCoordenadas: Coordenadas | null = null;

/** Si el permiso ya se denegó en esta sesión, no se vuelve a preguntar. */
let permisoDenegado = false;

/** Coordenadas ya obtenidas en esta sesión, o `null`. Para lecturas sin volver a pedir permiso. */
export function coordenadasRecordadas(): Coordenadas | null {
  return ultimasCoordenadas;
}

/**
 * Pide permiso y lee la posición actual. Reusa la última conocida salvo que se pase
 * `{ forzar: true }` (el botón "Actualizar mi ubicación"). No se usa un watch: hace falta un
 * punto, no seguir al usuario, y una suscripción viva gastaría batería sin motivo.
 */
export async function pedirUbicacion(opciones?: { forzar?: boolean }): Promise<ResultadoUbicacion> {
  const forzar = opciones?.forzar ?? false;

  if (!forzar && ultimasCoordenadas) return { ok: true, coordenadas: ultimasCoordenadas };
  if (!forzar && permisoDenegado) return { ok: false, motivo: 'DENEGADO' };

  try {
    const servicios = await Location.hasServicesEnabledAsync();
    if (!servicios) return { ok: false, motivo: 'DESACTIVADO' };

    const permiso = await Location.requestForegroundPermissionsAsync();
    if (permiso.status !== Location.PermissionStatus.GRANTED) {
      permisoDenegado = true;
      return { ok: false, motivo: 'DENEGADO' };
    }

    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    ultimasCoordenadas = {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
    };
    permisoDenegado = false;

    return { ok: true, coordenadas: ultimasCoordenadas };
  } catch {
    return { ok: false, motivo: 'ERROR' };
  }
}

/**
 * Distancia en texto: metros hasta 1 km, kilómetros con un decimal (coma) de ahí en más.
 * Se usa en la ficha para indicar qué tan lejos está quien publicó.
 */
export function distanciaEnTexto(km: number): string {
  if (km < 1) return `a ${Math.max(1, Math.round(km * 1000))} m`;
  return `a ${km.toFixed(1).replace('.', ',')} km`;
}
