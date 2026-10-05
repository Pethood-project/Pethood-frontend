/**
 * Permiso de ubicación y coordenadas del teléfono, para el alta de un aviso de mascota
 * perdida (GUI-25). La precondición de HU-13.1 es tener la ubicación habilitada, y el backend
 * exige las coordenadas: son las del dispositivo al momento de publicar, no las del animal.
 *
 * Nunca deja al usuario trabado:
 * - El permiso se pide al entrar, pero el formulario se puede completar igual sin él.
 * - "denegado" se puede volver a pedir; "bloqueado" (el sistema ya no muestra el diálogo)
 *   lleva a Ajustes, y al volver a la app se revisa solo.
 * - Las coordenadas se piden recién al publicar, así el GPS no se enciende de más.
 *
 * Las coordenadas salen de `lib/ubicacion`, la misma lectura que usan las distancias y el
 * filtro por cercanía de toda la app: así la posición que se toma acá queda recordada para el
 * resto de la sesión. Este hook sólo agrega lo que el alta necesita además: saber el estado
 * del permiso para mostrar la nota y llevar a Ajustes cuando el sistema ya no pregunta.
 */
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { pedirUbicacion, type Coordenadas } from '@/lib/ubicacion';

export type EstadoPermisoUbicacion = 'verificando' | 'concedido' | 'denegado' | 'bloqueado';

function estadoDe(permiso: Location.LocationPermissionResponse): EstadoPermisoUbicacion {
  if (permiso.granted) return 'concedido';
  return permiso.canAskAgain ? 'denegado' : 'bloqueado';
}

export function useUbicacionDispositivo() {
  const [estado, setEstado] = useState<EstadoPermisoUbicacion>('verificando');

  /** Mira el permiso sin pedirlo: sirve para enterarse de lo que se cambió en Ajustes. */
  const revisar = useCallback(async (): Promise<Location.LocationPermissionResponse> => {
    const actual = await Location.getForegroundPermissionsAsync();
    setEstado(estadoDe(actual));
    return actual;
  }, []);

  /** Lo pide si todavía se puede; si el sistema ya no muestra el diálogo, no insiste. */
  const pedir = useCallback(async (): Promise<void> => {
    try {
      const actual = await revisar();
      if (actual.granted || !actual.canAskAgain) return;

      setEstado(estadoDe(await Location.requestForegroundPermissionsAsync()));
    } catch {
      setEstado('denegado');
    }
  }, [revisar]);

  useEffect(() => {
    void pedir();

    // Al volver de Ajustes la app pasa a primer plano: ahí se ve si el usuario lo habilitó.
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') void revisar().catch(() => undefined);
    });

    return () => suscripcion.remove();
  }, [pedir, revisar]);

  /** La acción de la nota: vuelve a pedir el permiso, o abre Ajustes si ya no se puede. */
  const permitir = useCallback((): void => {
    if (estado === 'bloqueado') {
      void Linking.openSettings();
      return;
    }
    void pedir();
  }, [estado, pedir]);

  /**
   * Coordenadas actuales. Lanza con un mensaje para mostrar tal cual si la ubicación del
   * teléfono está apagada o no se pudo obtener.
   */
  const obtenerCoordenadas = useCallback(async (): Promise<Coordenadas> => {
    // `forzar`: la posición es la del momento de publicar, no una recordada de antes.
    const resultado = await pedirUbicacion({ forzar: true });
    if (resultado.ok) return resultado.coordenadas;

    if (resultado.motivo === 'DESACTIVADO') {
      throw new Error('Activá la ubicación del teléfono para poder publicar el aviso.');
    }
    if (resultado.motivo === 'DENEGADO') {
      void revisar().catch(() => undefined);
      throw new Error('Permití el acceso a tu ubicación para publicar el aviso.');
    }
    throw new Error('No pudimos obtener tu ubicación. Intentalo de nuevo en unos segundos.');
  }, [revisar]);

  return { estado, permitir, obtenerCoordenadas };
}
