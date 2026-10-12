/**
 * Deslizar un mensaje hacia la derecha para responderlo, como en WhatsApp: la burbuja sigue
 * al dedo, a la izquierda aparece la flecha de responder y, si se pasó del umbral, al soltar
 * vuelve a su lugar y arriba de la barra queda la cita.
 *
 * Es un `Pan` de `react-native-gesture-handler` y no un `Swipeable`: el swipeable deja la
 * acción abierta y hay que cerrarlo a mano, y acá la acción se dispara al soltar, sin quedar
 * nada abierto. Corre en el hilo de UI, así que sigue al dedo aunque el JS esté ocupado.
 *
 * **Convive con el scroll de la lista** porque sólo se activa hacia la derecha y falla apenas
 * el dedo se mueve en vertical: un scroll normal nunca se confunde con una respuesta. El
 * mantener apretado de la burbuja tampoco se pierde: si el dedo no se mueve, el gesto ni
 * arranca.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PALETA } from '@/constants/theme';

/** Cuánto hay que arrastrar para que al soltar se responda. */
const UMBRAL = 56;
/** Hasta dónde llega la burbuja: pasado el umbral, sigue al dedo con resistencia. */
const MAXIMO = 84;
/** Cuánto se mueve el dedo antes de que el gesto se active (y cuánto en vertical lo cancela). */
const ARRANQUE = 12;
/** Diámetro del círculo de la flecha. */
const ICONO = 32;

interface DeslizarParaResponderProps {
  /** Sin esto el gesto está apagado: pendientes, eliminados, tarjetas o sala de sólo lectura. */
  onResponder?: () => void;
  children: ReactNode;
}

export function DeslizarParaResponder({ onResponder, children }: DeslizarParaResponderProps) {
  const x = useSharedValue(0);

  const responder = (): void => onResponder?.();

  const gesto = Gesture.Pan()
    .enabled(onResponder !== undefined)
    // Un solo número positivo: se activa sólo al ir hacia la DERECHA. Hacia la izquierda no
    // pasa nada, y el gesto de "atrás" del sistema arranca desde el borde, no desde acá.
    .activeOffsetX(ARRANQUE)
    .failOffsetY([-ARRANQUE, ARRANQUE])
    .onUpdate((evento) => {
      const t = Math.max(0, evento.translationX);
      // Hasta el umbral sigue al dedo; después cuesta más, como un elástico.
      x.value = t <= UMBRAL ? t : Math.min(MAXIMO, UMBRAL + (t - UMBRAL) * 0.35);
    })
    .onEnd(() => {
      if (x.value >= UMBRAL) scheduleOnRN(responder);
      x.value = withTiming(0, { duration: 180 });
    })
    .onFinalize(() => {
      // Un gesto cancelado (lo ganó el scroll, entró una llamada) también vuelve a su lugar.
      if (x.value !== 0) x.value = withTiming(0, { duration: 180 });
    });

  const estiloContenido = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const estiloIcono = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [ARRANQUE, UMBRAL], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(x.value, [ARRANQUE, UMBRAL], [0.6, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <GestureDetector gesture={gesto}>
      <View>
        {/* Detrás de la burbuja, pegada al borde izquierdo: se descubre a medida que la burbuja
            se corre. `pointerEvents="none"`: es indicación, no botón. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            },
            estiloIcono,
          ]}
        >
          <View
            style={{ width: ICONO, height: ICONO, borderRadius: ICONO / 2 }}
            className="items-center justify-center bg-organic-neutral-200"
          >
            <Ionicons name="arrow-undo" size={17} color={PALETA.accent[700]} />
          </View>
        </Animated.View>

        <Animated.View style={estiloContenido}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}
