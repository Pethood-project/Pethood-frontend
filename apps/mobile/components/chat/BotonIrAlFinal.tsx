/**
 * La flechita para volver de un saque al último mensaje, como en WhatsApp: aparece cuando se
 * subió en la conversación y queda flotando sobre la lista, justo arriba del botón de enviar.
 *
 * Si mientras tanto llegaron mensajes del otro, lleva el contador encima (el mismo badge de las
 * filas del listado), así no hace falta bajar para enterarse de que hay algo nuevo.
 *
 * Ni el artboard ni la HU la definen: se armó con los tokens del diseño Organic —el círculo
 * claro con borde y sombra suave de la burbuja recibida, la flecha en el acento—.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BadgeContador } from '@/components/ui/BadgeContador';
import { PALETA } from '@/constants/theme';

/** Diámetro del botón: el mismo alto que el de enviar de la barra. */
const DIAMETRO = 43;

interface BotonIrAlFinalProps {
  /** Se subió lo suficiente como para que valga la pena ofrecer volver. */
  visible: boolean;
  /** Mensajes del otro que llegaron mientras se estaba arriba. */
  nuevos: number;
  onPress: () => void;
}

export function BotonIrAlFinal({ visible, nuevos, onPress }: BotonIrAlFinalProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      className="absolute bottom-3 right-[15px]"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          nuevos > 0 ? `Ir al último mensaje, ${nuevos} nuevos` : 'Ir al último mensaje'
        }
        onPress={onPress}
        hitSlop={6}
        style={{
          width: DIAMETRO,
          height: DIAMETRO,
          borderRadius: DIAMETRO / 2,
          // La sombra de la burbuja recibida: `0 2px 8px rgba(150,120,80,.10)`, un poco más
          // marcada porque flota sobre los mensajes.
          shadowColor: '#966850',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 4,
        }}
        className="items-center justify-center border border-organic-neutral-300 bg-organic-neutral-100 active:opacity-80"
      >
        <Ionicons name="chevron-down" size={22} color={PALETA.accent[700]} />

        <BadgeContador
          cantidad={nuevos}
          accessibilityLabel={`${nuevos} mensajes nuevos`}
        />
      </Pressable>
    </Animated.View>
  );
}
