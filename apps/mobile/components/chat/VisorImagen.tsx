/**
 * Visor de una foto del chat a pantalla completa, con zoom de pellizco (HU-5.2).
 *
 * Se arma con `react-native-gesture-handler` y `react-native-reanimated`, que ya son
 * dependencias del proyecto: una librería de galería traería un módulo nativo y el equipo
 * prueba con Expo Go.
 *
 * Los gestos corren en el hilo de UI (worklets de Reanimated), así que el zoom sigue al
 * dedo aunque el hilo de JS esté ocupado recibiendo mensajes por el socket.
 */
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PALETA } from '@/constants/theme';

/** Hasta dónde se puede agrandar. Más allá de 5× una foto de celular ya es un mosaico. */
const ESCALA_MAXIMA = 5;
/** A cuánto lleva el doble toque. */
const ESCALA_DOBLE_TOQUE = 2.5;

interface VisorImagenProps {
  /** URL de la foto a mostrar, o `null` para mantener el visor cerrado. */
  uri: string | null;
  onCerrar: () => void;
}

/**
 * Deja la imagen dentro de la pantalla: sin esto se puede arrastrar hasta perderla de
 * vista y no hay forma de traerla de vuelta.
 *
 * El margen que se puede desplazar es la mitad de lo que la imagen creció respecto de la
 * pantalla, porque el punto de origen del escalado es el centro.
 */
function limitar(valor: number, limite: number): number {
  'worklet';
  return Math.min(Math.max(valor, -limite), limite);
}

export function VisorImagen({ uri, onCerrar }: VisorImagenProps) {
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();

  const escala = useSharedValue(1);
  const escalaPrevia = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xPrevia = useSharedValue(0);
  const yPrevia = useSharedValue(0);

  const reiniciar = (): void => {
    escala.value = withTiming(1);
    escalaPrevia.value = 1;
    x.value = withTiming(0);
    y.value = withTiming(0);
    xPrevia.value = 0;
    yPrevia.value = 0;
  };

  const cerrar = (): void => {
    // Se reinicia al cerrar para que la próxima foto no herede el zoom de la anterior.
    reiniciar();
    onCerrar();
  };

  /** Corrige el desplazamiento cuando la imagen ya no puede salirse de la pantalla. */
  const ajustarDentroDeLimites = (): void => {
    'worklet';
    const maximoX = Math.max(0, (anchoPantalla * escala.value - anchoPantalla) / 2);
    const maximoY = Math.max(0, (altoPantalla * escala.value - altoPantalla) / 2);

    x.value = withTiming(limitar(x.value, maximoX));
    y.value = withTiming(limitar(y.value, maximoY));
    xPrevia.value = limitar(xPrevia.value, maximoX);
    yPrevia.value = limitar(yPrevia.value, maximoY);
  };

  // Pellizco: el gesto de separar y juntar los dedos.
  const pellizco = Gesture.Pinch()
    .onUpdate((evento) => {
      escala.value = Math.min(escalaPrevia.value * evento.scale, ESCALA_MAXIMA);
    })
    .onEnd(() => {
      // Achicar por debajo del tamaño original y soltar devuelve la foto a su lugar, en vez
      // de dejarla diminuta y descentrada.
      if (escala.value < 1) {
        escala.value = withTiming(1);
        escalaPrevia.value = 1;
        x.value = withTiming(0);
        y.value = withTiming(0);
        xPrevia.value = 0;
        yPrevia.value = 0;
        return;
      }

      escalaPrevia.value = escala.value;
      ajustarDentroDeLimites();
    });

  // Arrastre: sólo tiene sentido con la foto ampliada, porque sin zoom no hay nada que
  // correr y el gesto competiría con el scroll de la conversación de atrás.
  const arrastre = Gesture.Pan()
    .onUpdate((evento) => {
      if (escala.value <= 1) return;
      x.value = xPrevia.value + evento.translationX;
      y.value = yPrevia.value + evento.translationY;
    })
    .onEnd(() => {
      xPrevia.value = x.value;
      yPrevia.value = y.value;
      ajustarDentroDeLimites();
    });

  // Doble toque: el atajo de siempre para ampliar sin hacer el pellizco.
  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (escala.value > 1) {
        escala.value = withTiming(1);
        escalaPrevia.value = 1;
        x.value = withTiming(0);
        y.value = withTiming(0);
        xPrevia.value = 0;
        yPrevia.value = 0;
        return;
      }

      escala.value = withTiming(ESCALA_DOBLE_TOQUE);
      escalaPrevia.value = ESCALA_DOBLE_TOQUE;
    });

  // Pellizco y arrastre a la vez: con la foto ampliada se puede reencuadrar sin soltar.
  // El doble toque va aparte para que no se dispare durante un pellizco.
  const gestos = Gesture.Exclusive(Gesture.Simultaneous(pellizco, arrastre), dobleToque);

  const estiloImagen = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: escala.value }],
  }));

  return (
    <Modal
      visible={uri !== null}
      transparent
      animationType="fade"
      // Android: sin esto el botón físico de retroceso no cierra el visor.
      onRequestClose={cerrar}
      statusBarTranslucent
    >
      {/* Gesture handler necesita su propia raíz DENTRO del Modal: el `GestureHandlerRootView`
          del layout no alcanza porque el Modal se monta en otra jerarquía nativa. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black">
          <GestureDetector gesture={gestos}>
            <Animated.View className="flex-1 items-center justify-center">
              {uri ? (
                <Animated.Image
                  source={{ uri }}
                  style={[{ width: anchoPantalla, height: altoPantalla }, estiloImagen]}
                  resizeMode="contain"
                  accessibilityLabel="Foto del mensaje ampliada"
                />
              ) : null}
            </Animated.View>
          </GestureDetector>

          {/* Fuera del GestureDetector para que el gesto de zoom no se coma el toque. */}
          <SafeAreaView className="absolute left-0 right-0 top-0" edges={['top']}>
            <View className="flex-row justify-end p-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar la foto"
                onPress={cerrar}
                hitSlop={12}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/50 active:opacity-70"
              >
                <Ionicons name="close" size={22} color={PALETA.blanco} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
