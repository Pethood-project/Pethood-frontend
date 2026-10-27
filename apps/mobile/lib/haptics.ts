/**
 * Vibraciones de la app, con nombres por intención (`vibrar.exito()`) y no por motor: cada
 * pantalla dice qué pasó y acá se decide cómo se siente.
 *
 * Una vibración por gesto, ninguna al hacer scroll ni por cada tecla. Se pueden apagar desde
 * Mi perfil; la preferencia se recuerda en el dispositivo. En web no hay nada que vibrar.
 */
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const CLAVE_PREFERENCIA = 'phd_vibraciones';
const ES_WEB = Platform.OS === 'web';

/** Activadas por defecto: se enciende solo lo que el usuario apagó a propósito. */
let activas = true;
const oyentes = new Set<(valor: boolean) => void>();

async function leerPreferencia(): Promise<string | null> {
  if (ES_WEB) return null;
  return SecureStore.getItemAsync(CLAVE_PREFERENCIA);
}

/** Se llama una vez al arrancar la app. Si no hay nada guardado, quedan activadas. */
export async function cargarPreferenciaVibraciones(): Promise<void> {
  try {
    activas = (await leerPreferencia()) !== 'no';
    oyentes.forEach((oyente) => oyente(activas));
  } catch {
    // Sin acceso al almacenamiento seguro se queda el valor por defecto.
  }
}

export async function guardarPreferenciaVibraciones(valor: boolean): Promise<void> {
  activas = valor;
  oyentes.forEach((oyente) => oyente(valor));

  if (ES_WEB) return;

  try {
    await SecureStore.setItemAsync(CLAVE_PREFERENCIA, valor ? 'si' : 'no');
  } catch {
    // La preferencia vale por esta sesión aunque no se haya podido guardar.
  }
}

/** Para el interruptor de Mi perfil: el valor actual y cómo cambiarlo. */
export function useVibraciones(): [boolean, (valor: boolean) => void] {
  const [valor, setValor] = useState(activas);

  useEffect(() => {
    oyentes.add(setValor);
    setValor(activas);
    return () => {
      oyentes.delete(setValor);
    };
  }, []);

  const cambiar = useCallback((siguiente: boolean) => {
    void guardarPreferenciaVibraciones(siguiente);
  }, []);

  return [valor, cambiar];
}

/** Dispara sin esperar y sin romper nada: una vibración que falla no es un error de la app. */
function disparar(accion: () => Promise<void>): void {
  if (!activas || ES_WEB) return;
  void accion().catch(() => undefined);
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

export const vibrar = {
  /** Un botón respondió al toque. */
  toque: () => disparar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** Algo más firme: una decisión tomada (guardar en el mazo, aceptar). */
  firme: () => disparar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** Cambió la opción elegida o se cruzó un umbral (chips, tabs, deslizar). */
  seleccion: () => disparar(() => Haptics.selectionAsync()),

  exito: () =>
    disparar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  advertencia: () =>
    disparar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  error: () => disparar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

  /**
   * Para un hito, como una adopción aprobada: un golpe fuerte, otro más suave y el cierre de
   * éxito, en ese orden, para que se sienta como un redoble y no como un aviso.
   */
  celebracion: () =>
    disparar(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await esperar(140);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await esperar(110);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }),
};
