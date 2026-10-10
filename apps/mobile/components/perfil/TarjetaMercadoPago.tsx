/**
 * Tarjeta «Mercado Pago» de «Perfil del refugio» (spec 027): vincular la cuenta del refugio
 * para que las donaciones se confirmen solas, ver el estado y desvincular.
 *
 * Vincular abre la autorización de Mercado Pago en el navegador del teléfono; el backend
 * recibe la vuelta y la conexión aparece al volver a la app (se recarga al recuperar el foco).
 * No se muestra si el backend no tiene Mercado Pago configurado.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';

import { useToast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PALETA } from '@/constants/theme';
import { ApiError } from '@/services/api';
import {
  desvincularMercadoPago,
  iniciarVinculacion,
  obtenerEstadoMercadoPago,
  type EstadoMercadoPago,
} from '@/services/mercadoPago';
import { aFechaVisible } from '@/shared/validation/dates';

function mensajeDe(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto;
}

export function TarjetaMercadoPago() {
  const toast = useToast();
  const [estado, setEstado] = useState<EstadoMercadoPago | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmarDesvincular, setConfirmarDesvincular] = useState(false);

  // Sin dependencias que cambien en cada render: si no, el efecto de foco se redispara en
  // bucle (mismo problema que tuvo «Mis Campañas»).
  const cargar = useCallback(() => {
    obtenerEstadoMercadoPago()
      .then(setEstado)
      // Si falla, la tarjeta no se muestra: el resto del perfil sigue funcionando.
      .catch(() => setEstado(null));
  }, []);

  useFocusEffect(cargar);

  // En Android `openBrowserAsync` resuelve apenas abre el navegador, y volver de la pestaña no
  // cambia el foco de la navegación: se recarga cuando la app vuelve a primer plano.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') cargar();
    });
    return () => suscripcion.remove();
  }, [cargar]);

  const vincular = async (): Promise<void> => {
    setTrabajando(true);
    try {
      const { url } = await iniciarVinculacion();
      await WebBrowser.openBrowserAsync(url);
      cargar();
    } catch (err) {
      toast.mostrarError(mensajeDe(err, 'No pudimos abrir Mercado Pago. Intentalo de nuevo.'));
    } finally {
      setTrabajando(false);
    }
  };

  const desvincular = async (): Promise<void> => {
    setTrabajando(true);
    try {
      await desvincularMercadoPago();
      setConfirmarDesvincular(false);
      toast.mostrarExito('Desvinculaste Mercado Pago.');
      cargar();
    } catch (err) {
      toast.mostrarError(
        mensajeDe(err, 'No pudimos desvincular Mercado Pago. Intentalo de nuevo.'),
      );
    } finally {
      setTrabajando(false);
    }
  };

  if (!estado?.disponible) return null;

  const vinculada = estado.estado === 'VINCULADA';
  const texto = vinculada
    ? `Vinculada el ${aFechaVisible(new Date(estado.fechaVinculacion!))}. Las donaciones se confirman solas.`
    : estado.estado === 'REVINCULAR'
      ? 'Mercado Pago dejó de aceptar la conexión. Volvé a vincularla.'
      : 'Vinculá tu cuenta de Mercado Pago para que las donaciones se confirmen solas.';

  return (
    <View className="mt-6 gap-3 rounded-[22px] bg-organic-surface p-4">
      <View className="flex-row items-center gap-2">
        <Ionicons
          name={vinculada ? 'checkmark-circle' : 'card-outline'}
          size={20}
          color={vinculada ? PALETA.estado.exito : PALETA.accent[600]}
        />
        <Text className="font-cuerpo-bold text-[16px] text-organic-neutral-900">Mercado Pago</Text>
      </View>
      <Text className="font-cuerpo text-[14px] leading-[19px] text-organic-neutral-700">
        {texto}
      </Text>

      {vinculada ? (
        <Pressable
          accessibilityRole="button"
          disabled={trabajando}
          onPress={() => setConfirmarDesvincular(true)}
          className="self-start rounded-full border border-red-300 px-4 py-2 active:opacity-70"
        >
          <Text className="font-cuerpo-bold text-[14px] text-red-700">Desvincular</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={trabajando}
          onPress={() => void vincular()}
          className={`items-center rounded-full bg-organic-accent-600 py-3 active:opacity-90 ${trabajando ? 'opacity-60' : ''}`}
        >
          <Text className="font-cuerpo-bold text-[15px] text-white">Vincular Mercado Pago</Text>
        </Pressable>
      )}

      <ConfirmDialog
        visible={confirmarDesvincular}
        tono="peligro"
        titulo="¿Desvincular Mercado Pago?"
        mensaje="Las donaciones vuelven a confirmarse a mano."
        textoConfirmar="Desvincular"
        textoCancelar="Volver"
        cargando={trabajando}
        onConfirmar={() => void desvincular()}
        onCerrar={() => setConfirmarDesvincular(false)}
      />
    </View>
  );
}
