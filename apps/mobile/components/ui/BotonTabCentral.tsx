/**
 * Botón redondo destacado del centro de la barra inferior.
 *
 * Da dos señales distintas, que son cosas distintas:
 * - **Activo**: la pestaña es la que se está viendo. Anillo blanco, sombra más marcada y el
 *   ícono relleno.
 * - **Presionado**: el dedo está encima ahora mismo. Se achica y se oscurece, y vuelve con
 *   un rebote al soltar.
 *
 * La presión se anima en el hilo de UI para que responda aunque la pantalla esté ocupada
 * cargando datos, que es justo cuando se toca la barra.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PALETA } from '@/constants/theme';

const DIAMETRO = 64;

/**
 * Cuánto sobresale por encima de la barra. Lo suficiente para que el círculo tape la
 * barrita del indicador, que corre por el borde superior: con menos, las puntas de la
 * barrita asoman por los costados del círculo.
 */
const ELEVACION = 18;

interface BotonTabCentralProps {
  icono: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
  activo: boolean;
  /** Se pasa tal cual a `Pressable`, así el evento del navegador de tabs llega intacto. */
  onPress: PressableProps['onPress'];
}

export function BotonTabCentral({ icono, etiqueta, activo, onPress }: BotonTabCentralProps) {
  const presion = useSharedValue(0);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(presion.value, [0, 1], [1, 0.88]) }],
    backgroundColor: interpolateColor(
      presion.value,
      [0, 1],
      [PALETA.tabCentral.amarillo, PALETA.tabCentral.amarilloPresionado],
    ),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      onPressIn={() => {
        // Bajar rápido y volver con rebote: el golpe se siente inmediato y el retorno, vivo.
        presion.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        presion.value = withSpring(0, { damping: 12, stiffness: 260 });
      }}
      style={{ top: -ELEVACION }}
      className="items-center justify-start"
    >
      <Animated.View
        style={[
          {
            height: DIAMETRO,
            width: DIAMETRO,
            borderRadius: DIAMETRO / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: activo ? 4 : 0,
            borderColor: PALETA.blanco,
            shadowColor: PALETA.tabCentral.amarillo,
            shadowOpacity: activo ? 0.55 : 0.3,
            shadowRadius: activo ? 12 : 6,
            shadowOffset: { width: 0, height: activo ? 6 : 3 },
            elevation: activo ? 10 : 5,
          },
          estilo,
        ]}
      >
        <Ionicons name={icono} size={30} color={PALETA.blanco} />
      </Animated.View>
    </Pressable>
  );
}
