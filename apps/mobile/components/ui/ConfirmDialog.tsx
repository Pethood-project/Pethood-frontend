/**
 * Modal de confirmación para acciones críticas (regla transversal 6 de CLAUDE.md) y para
 * bloqueos que el usuario no puede resolver desde donde está.
 *
 * Reemplaza a `Alert.alert` en los flujos con identidad visual propia: el nativo no admite
 * la paleta ni la tipografía de PetHood. Se sigue usando `Alert.alert` para lo accesorio,
 * como la elección de cámara o galería en PhotoPicker.
 *
 * Tres modos:
 * - con `onConfirmar`: Cancelar + acción, para confirmar algo irreversible.
 * - con `accionPrincipal`: la salida del bloqueo a ancho completo y el descarte debajo,
 *   como texto. Es el cartel que frena una acción pero deja algo por hacer (GUI-7.1:
 *   "Tenés que verificarte" → "Verificar mi cuenta").
 * - sin ninguno de los dos: un único "Entendido", para informar un bloqueo sin salida.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export type TonoDialogo = 'peligro' | 'advertencia' | 'exito' | 'bloqueo';

interface ConfirmDialogProps {
  visible: boolean;
  tono?: TonoDialogo;
  titulo: string;
  mensaje: string;
  /** Segunda línea, para explicar el siguiente paso cuando el mensaje solo describe el bloqueo. */
  detalle?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Sin este handler el diálogo es informativo y muestra un solo botón. */
  onConfirmar?: () => void;
  /**
   * Salida del bloqueo, a ancho completo, con el descarte como texto debajo. Se ignora si
   * hay `onConfirmar`: son dos formas distintas de cerrar el mismo diálogo.
   */
  accionPrincipal?: { etiqueta: string; onPress: () => void };
  /** Texto del descarte cuando hay `accionPrincipal`. */
  textoDescartar?: string;
  /** Pisa el ícono del tono, para cuando el cartel habla de algo más específico. */
  icono?: keyof typeof Ionicons.glyphMap;
  onCerrar: () => void;
  cargando?: boolean;
  /** Contenido extra entre el detalle y los botones, por ejemplo un campo de comentario. */
  children?: ReactNode;
}

const ESTILOS: Record<TonoDialogo, { icono: keyof typeof Ionicons.glyphMap; color: string; fondo: string; boton: string }> = {
  peligro: {
    icono: 'trash-outline',
    color: PALETA.estado.error,
    fondo: 'bg-red-50',
    boton: 'bg-red-600',
  },
  advertencia: {
    icono: 'alert-circle-outline',
    color: PALETA.estado.advertencia,
    fondo: 'bg-amber-50',
    boton: 'bg-amber-500',
  },
  exito: {
    icono: 'checkmark-circle-outline',
    color: PALETA.estado.exito,
    fondo: 'bg-emerald-50',
    boton: 'bg-emerald-600',
  },
  bloqueo: {
    icono: 'alert-circle-outline',
    color: PALETA.accent[700],
    fondo: 'bg-organic-accent-200',
    boton: 'bg-organic-accent-600',
  },
};

export function ConfirmDialog({
  visible,
  tono = 'peligro',
  titulo,
  mensaje,
  detalle,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  accionPrincipal,
  textoDescartar = 'Entendido',
  icono,
  onCerrar,
  cargando = false,
  children,
}: ConfirmDialogProps) {
  const estilo = ESTILOS[tono];
  const esConfirmacion = onConfirmar !== undefined;
  const esBloqueo = !esConfirmacion && accionPrincipal !== undefined;

  // Mientras la acción está en curso el diálogo no se puede cerrar por atrás ni por el fondo,
  // para no dejar una petición huérfana sin feedback.
  const cerrarSiSePuede = (): void => {
    if (!cargando) onCerrar();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrarSiSePuede}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-8"
        onPress={cerrarSiSePuede}
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
      >
        <Pressable
          className="w-full rounded-3xl bg-white p-6"
          onPress={() => undefined}
          accessibilityViewIsModal
        >
          <View className={`mb-4 h-14 w-14 items-center justify-center self-center rounded-full ${estilo.fondo}`}>
            <Ionicons name={icono ?? estilo.icono} size={28} color={estilo.color} />
          </View>

          <Text className="text-center text-lg font-bold text-gray-900">{titulo}</Text>
          <Text className="mt-2 text-center text-base leading-6 text-gray-600">{mensaje}</Text>

          {detalle ? (
            <Text className="mt-3 text-center text-sm leading-5 text-gray-500">{detalle}</Text>
          ) : null}

          {children ? <View className="mt-4">{children}</View> : null}

          <View className={`mt-6 gap-3 ${esConfirmacion ? 'flex-row' : ''}`}>
            {esBloqueo ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={accionPrincipal!.onPress}
                  className={`items-center justify-center rounded-2xl py-3.5 active:opacity-90 ${estilo.boton}`}
                >
                  <Text className="text-base font-semibold text-white">
                    {accionPrincipal!.etiqueta}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={onCerrar}
                  className="items-center justify-center py-1 active:opacity-60"
                >
                  <Text className="text-[15px] text-organic-neutral-600">{textoDescartar}</Text>
                </Pressable>
              </>
            ) : !esConfirmacion ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCerrar}
                className="items-center justify-center rounded-2xl bg-pethood-orange py-3.5 active:opacity-90"
              >
                <Text className="text-base font-semibold text-white">Entendido</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={cargando}
                  onPress={onCerrar}
                  className="flex-1 items-center justify-center rounded-2xl border border-gray-300 py-3.5 active:opacity-80"
                >
                  <Text className="text-base font-semibold text-gray-700">{textoCancelar}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: cargando }}
                  disabled={cargando}
                  onPress={onConfirmar}
                  className={`flex-1 items-center justify-center rounded-2xl py-3.5 active:opacity-90 ${estilo.boton} ${cargando ? 'opacity-60' : ''}`}
                >
                  {cargando ? (
                    <ActivityIndicator color={PALETA.blanco} />
                  ) : (
                    <Text className="text-base font-semibold text-white">{textoConfirmar}</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
