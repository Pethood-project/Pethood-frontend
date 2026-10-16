/**
 * Deslizar una fila hacia la izquierda para eliminarla, como en la bandeja del teléfono: la
 * fila sigue al dedo y descubre detrás el fondo rojo con «Eliminar». Si al soltar se pasó del
 * umbral (o se la tiró rápido), termina de irse por el costado, el hueco se cierra y recién
 * ahí se elimina. Si no, vuelve a su lugar.
 *
 * La animación va antes del pedido para que se vea qué pasó; si el backend rechaza la baja
 * (`onEliminar` devuelve `false`), la fila vuelve a aparecer.
 *
 * Mismo esquema que `chat/DeslizarParaResponder`: un `Pan` que sólo se activa en horizontal y
 * falla apenas el dedo se mueve en vertical, así convive con el scroll de la lista y con el
 * toque de la fila.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

/** Cuánto hay que arrastrar para que al soltar se elimine. */
const UMBRAL = 90;
/** Un tirón más rápido que esto (px/s hacia la izquierda) elimina aunque no llegue al umbral. */
const VELOCIDAD = 800;
/** Cuánto se mueve el dedo antes de que el gesto se active (y cuánto en vertical lo cancela). */
const ARRANQUE = 12;
/** Duraciones de la salida por el costado y del cierre del hueco, en ms. */
const SALIDA = 220;
const COLAPSO = 200;
const REGRESO = 180;

interface DeslizarParaEliminarProps {
  /** Elimina de verdad. `false` si falló: la fila vuelve a aparecer. */
  onEliminar: () => Promise<boolean>;
  /** Espacio debajo de la fila; se cierra junto con ella. */
  separacion?: number;
  /** Radio de las esquinas, para que el fondo rojo tenga la misma forma que la fila. */
  radio?: number;
  children: ReactNode;
}

export function DeslizarParaEliminar({
  onEliminar,
  separacion = 0,
  radio = 0,
  children,
}: DeslizarParaEliminarProps) {
  const x = useSharedValue(0);
  const ancho = useSharedValue(0);
  const alto = useSharedValue(0);
  /** 1 ocupa su lugar, 0 ya cerró el hueco. */
  const visible = useSharedValue(1);
  const saliendo = useSharedValue(false);

  const eliminar = async (): Promise<void> => {
    if (await onEliminar()) return;
    visible.value = withTiming(1, { duration: COLAPSO });
    x.value = withTiming(0, { duration: SALIDA });
    saliendo.value = false;
  };

  const gesto = Gesture.Pan()
    // Un solo número negativo: se activa sólo al ir hacia la IZQUIERDA.
    .activeOffsetX(-ARRANQUE)
    .failOffsetY([-ARRANQUE, ARRANQUE])
    .onUpdate((evento) => {
      if (saliendo.value) return;
      x.value = Math.min(0, evento.translationX);
    })
    .onEnd((evento) => {
      if (saliendo.value) return;
      const sale = x.value <= -UMBRAL || (evento.velocityX < -VELOCIDAD && x.value < -ARRANQUE);
      if (!sale) {
        x.value = withTiming(0, { duration: REGRESO });
        return;
      }
      saliendo.value = true;
      x.value = withTiming(-ancho.value, { duration: SALIDA }, (terminoSalida) => {
        if (!terminoSalida) return;
        visible.value = withTiming(0, { duration: COLAPSO }, (terminoColapso) => {
          if (terminoColapso) scheduleOnRN(eliminar);
        });
      });
    })
    .onFinalize(() => {
      // Un gesto cancelado (lo ganó el scroll) también vuelve a su lugar.
      if (!saliendo.value && x.value !== 0) x.value = withTiming(0, { duration: REGRESO });
    });

  // Hasta medir la fila no se le fija alto: así entra con su tamaño natural.
  const estiloContenedor = useAnimatedStyle(() =>
    alto.value === 0
      ? {}
      : { height: alto.value * visible.value, marginBottom: separacion * visible.value },
  );

  const estiloFila = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const estiloAccion = useAnimatedStyle(() => ({
    opacity: interpolate(-x.value, [ARRANQUE, UMBRAL], [0.3, 1], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        onLayout={(evento) => {
          ancho.value = evento.nativeEvent.layout.width;
        }}
        style={[
          { marginBottom: separacion, borderRadius: radio, overflow: 'hidden' },
          estiloContenedor,
        ]}
      >
        {/* Detrás de la fila: se descubre a medida que se corre. Es indicación, no botón. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estiloAccion]}>
          <View className="flex-1 flex-row items-center justify-end bg-red-50 pr-6">
            <View className="items-center gap-1">
              <Ionicons name="trash-outline" size={20} color={PALETA.estado.error} />
              <Text
                className="font-cuerpo-semi text-[13px]"
                style={{ color: PALETA.estado.error }}
              >
                Eliminar
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Se mide la fila y no el contenedor: el contenedor tiene el alto fijado, la fila
            no, así que si su texto cambia de tamaño (al marcarse leída) el alto la sigue. */}
        <Animated.View
          style={estiloFila}
          onLayout={(evento) => {
            if (!saliendo.value) alto.value = evento.nativeEvent.layout.height;
          }}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
