/**
 * Sellos de "Me gusta" / "Paso" que aparecen sobre la tarjeta mientras se la arrastra.
 *
 * Sin esta señal el usuario no sabe hacia qué lado está decidiendo hasta que suelta. La
 * opacidad sigue al dedo y llega al máximo justo en el umbral que dispara la decisión, así
 * que también comunica cuánto falta para que cuente.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { PALETA } from '@/constants/theme';

interface SelloDecisionProps {
  desplazamiento: SharedValue<number>;
  /** Distancia a partir de la cual el sello se ve entero. */
  umbral: number;
}

export function SelloDecision({ desplazamiento, umbral }: SelloDecisionProps) {
  const estiloGuardar = useAnimatedStyle(() => ({
    opacity: interpolate(desplazamiento.value, [0, umbral], [0, 1], 'clamp'),
  }));

  const estiloRechazar = useAnimatedStyle(() => ({
    opacity: interpolate(desplazamiento.value, [-umbral, 0], [1, 0], 'clamp'),
  }));

  return (
    <View pointerEvents="none" className="absolute inset-0 justify-start p-5">
      {/* `top-14` y no más arriba: por encima está el contador de fotos de la tarjeta, y
          el sello de "Paso" se le montaba encima. */}
      <Animated.View style={estiloGuardar} className="absolute left-5 top-14">
        <View
          className="flex-row items-center gap-1.5 rounded-2xl border-[3px] bg-white/85 px-3 py-1.5"
          style={{ borderColor: PALETA.accent[600] }}
        >
          <Ionicons name="heart" size={18} color={PALETA.accent[600]} />
          <Text
            className="font-cuerpo-bold text-base uppercase tracking-wide"
            style={{ color: PALETA.accent[600] }}
          >
            Me gusta
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={estiloRechazar} className="absolute right-5 top-14">
        <View
          className="flex-row items-center gap-1.5 rounded-2xl border-[3px] bg-white/85 px-3 py-1.5"
          style={{ borderColor: PALETA.neutral[500] }}
        >
          <Ionicons name="close" size={18} color={PALETA.neutral[600]} />
          <Text
            className="font-cuerpo-bold text-base uppercase tracking-wide"
            style={{ color: PALETA.neutral[600] }}
          >
            Paso
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
