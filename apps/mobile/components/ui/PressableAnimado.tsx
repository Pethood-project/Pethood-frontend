/**
 * `Pressable` con el mismo rebote de escala que ya usa `BotonTabCentral`, generalizado para
 * las tarjetas y botones de acción que necesitan esa misma señal de "esto respondió al
 * toque" sin repetir el `useSharedValue`/`withSpring` en cada componente.
 */
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableAnimadoProps extends PressableProps {
  /** Qué tan chico se pone al tocar. 0.96 es un rebote sutil; 0.9, uno bien marcado. */
  escala?: number;
}

export function PressableAnimado({
  escala = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...resto
}: PressableAnimadoProps) {
  const presion = useSharedValue(0);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - presion.value * (1 - escala) }],
  }));

  return (
    <AnimatedPressable
      style={[style as object, estiloAnimado]}
      onPressIn={(evento) => {
        presion.value = withTiming(1, { duration: 90 });
        onPressIn?.(evento);
      }}
      onPressOut={(evento) => {
        presion.value = withSpring(0, { damping: 12, stiffness: 260 });
        onPressOut?.(evento);
      }}
      {...resto}
    />
  );
}
