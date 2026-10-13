/**
 * Flecha de volver de toda la app: suelta, en el mismo color y tamaño y siempre al comienzo
 * del encabezado. Sólo lleva círculo cuando va sobre una foto (`sobreFoto`), donde sin fondo
 * se perdería; sobre una banda de color (`claro`) es blanca.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { PALETA } from '@/constants/theme';

interface BotonVolverProps {
  onPress: () => void;
  /** Se lee en voz alta. Por defecto "Volver". */
  etiqueta?: string;
  /** Va encima de una foto: con círculo claro para que se lea sobre cualquier imagen. */
  sobreFoto?: boolean;
  /** Va sobre una banda de color de la marca: flecha blanca. */
  claro?: boolean;
  /** Para posicionarla de forma absoluta cuando va sobre una foto. */
  style?: StyleProp<ViewStyle>;
}

export function BotonVolver({
  onPress,
  etiqueta = 'Volver',
  sobreFoto = false,
  claro = false,
  style,
}: BotonVolverProps) {
  if (sobreFoto) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        onPress={onPress}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70"
        style={style}
      >
        <Ionicons name="arrow-back" size={20} color={PALETA.grisCalido[900]} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      hitSlop={8}
      className="h-[42px] w-[34px] items-center justify-center active:opacity-70"
      style={style}
    >
      <Ionicons name="arrow-back" size={26} color={claro ? PALETA.blanco : PALETA.accent[700]} />
    </Pressable>
  );
}
