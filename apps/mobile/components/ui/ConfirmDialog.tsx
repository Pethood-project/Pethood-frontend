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
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
// El de la librería y no el de React Native: con edge-to-edge en Android el nativo no se
// entera del teclado y no mueve nada.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { PALETA } from '@/constants/theme';
import { vibrar } from '@/lib/haptics';

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

/** Cada tono: el círculo del ícono (fondo y trazo) y el color del botón de confirmar. */
const ESTILOS: Record<
  TonoDialogo,
  { icono: keyof typeof Ionicons.glyphMap; trazo: string; fondo: string; boton: string }
> = {
  peligro: {
    icono: 'trash-outline',
    trazo: PALETA.estado.error,
    fondo: PALETA.accent[100],
    boton: PALETA.estado.error,
  },
  advertencia: {
    icono: 'alert-circle-outline',
    trazo: PALETA.accent[700],
    fondo: PALETA.calido.amarilloClaro,
    boton: PALETA.accent[600],
  },
  exito: {
    icono: 'checkmark-circle-outline',
    trazo: PALETA.estado.exito,
    fondo: PALETA.accent[100],
    boton: PALETA.estado.exito,
  },
  bloqueo: {
    icono: 'alert-circle-outline',
    trazo: PALETA.accent[700],
    fondo: PALETA.accent[200],
    boton: PALETA.accent[600],
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

  // Lo destructivo avisa con el cuerpo antes de que haga falta leerlo.
  useEffect(() => {
    if (visible && (tono === 'peligro' || tono === 'advertencia')) vibrar.advertencia();
  }, [visible, tono]);

  const esConfirmacion = onConfirmar !== undefined;
  const esBloqueo = !esConfirmacion && accionPrincipal !== undefined;

  // Mientras la acción está en curso el diálogo no se puede cerrar por atrás ni por el fondo,
  // para no dejar una petición huérfana sin feedback.
  const cerrarSiSePuede = (): void => {
    if (!cargando) onCerrar();
  };

  return (
    // `statusBarTranslucent`: el modal ocupa la pantalla entera también en Android, así el
    // teclado se mide contra el mismo alto que en el resto de la app.
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cerrarSiSePuede}
      statusBarTranslucent
    >
      {/* Cuando la tarjeta trae un campo (`children`), el teclado la taparía: el padding
          sigue al teclado y la tarjeta se recentra en el espacio que queda arriba. El
          velo oscuro va por fuera para que cubra toda la pantalla mientras tanto. */}
      <View className="flex-1 bg-black/40">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {/* Fondo y tarjeta son hermanos: un Pressable dentro de otro en web (React 19)
              dispara onPress al renderizar y tira el handler de cerrar. */}
          <View className="flex-1 items-center justify-center px-8">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={cerrarSiSePuede}
              className="absolute inset-0"
            />
            <View
              className="z-10 w-full rounded-[28px] border border-organic-neutral-300 bg-organic-surface p-6"
              accessibilityViewIsModal
            >
              <View
                style={{ backgroundColor: estilo.fondo }}
                className="mb-4 h-16 w-16 items-center justify-center self-center rounded-full"
              >
                <Ionicons name={icono ?? estilo.icono} size={30} color={estilo.trazo} />
              </View>

              <Text className="text-center font-titulo text-[22px] leading-[27px] text-organic-neutral-900">
                {titulo}
              </Text>
              <Text className="mt-2 text-center font-cuerpo text-[16px] leading-6 text-organic-neutral-700">
                {mensaje}
              </Text>

              {detalle ? (
                <Text className="mt-3 text-center font-cuerpo text-[14px] leading-5 text-organic-neutral-600">
                  {detalle}
                </Text>
              ) : null}

              {children ? <View className="mt-4">{children}</View> : null}

              <View className={`mt-6 gap-3 ${esConfirmacion ? 'flex-row' : ''}`}>
                {esBloqueo ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={accionPrincipal!.onPress}
                      style={{ backgroundColor: estilo.boton, borderRadius: 20 }}
                      className="items-center justify-center py-3.5 active:opacity-90"
                    >
                      <Text className="font-cuerpo-semi text-base text-white">
                        {accionPrincipal!.etiqueta}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={onCerrar}
                      className="items-center justify-center py-1 active:opacity-60"
                    >
                      <Text className="font-cuerpo text-[15px] text-organic-neutral-600">
                        {textoDescartar}
                      </Text>
                    </Pressable>
                  </>
                ) : !esConfirmacion ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onCerrar}
                    style={{ borderRadius: 20 }}
                    className="items-center justify-center bg-organic-accent-600 py-3.5 active:opacity-90"
                  >
                    <Text className="font-cuerpo-semi text-base text-white">Entendido</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      disabled={cargando}
                      onPress={onCerrar}
                      style={{ borderRadius: 20 }}
                      className="flex-1 items-center justify-center border border-organic-neutral-300 bg-organic-surface py-3.5 active:opacity-80"
                    >
                      <Text className="font-cuerpo-semi text-base text-organic-neutral-700">
                        {textoCancelar}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ busy: cargando }}
                      disabled={cargando}
                      onPress={onConfirmar}
                      style={{ backgroundColor: estilo.boton, borderRadius: 20 }}
                      className={`flex-1 items-center justify-center py-3.5 active:opacity-90 ${cargando ? 'opacity-60' : ''}`}
                    >
                      {cargando ? (
                        <ActivityIndicator color={PALETA.blanco} />
                      ) : (
                        <Text className="font-cuerpo-semi text-base text-white">
                          {textoConfirmar}
                        </Text>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
