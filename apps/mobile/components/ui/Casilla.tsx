/**
 * Casilla de verificación con su texto al lado, para las conformidades que hay que marcar
 * antes de confirmar algo (GUI-7.1.2).
 *
 * Es un `Pressable` que envuelve todo: el área de toque es la fila entera, no el cuadradito
 * de 20px.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface CasillaProps {
  etiqueta: string;
  marcada: boolean;
  onChange: (marcada: boolean) => void;
}

export function Casilla({ etiqueta, marcada, onChange }: CasillaProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={etiqueta}
      onPress={() => onChange(!marcada)}
      className="flex-row items-start gap-2.5 active:opacity-70"
    >
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
          marcada
            ? 'border-organic-accent-600 bg-organic-accent-600'
            : 'border-organic-neutral-400 bg-organic-surface'
        }`}
      >
        {marcada ? <Ionicons name="checkmark" size={13} color={PALETA.blanco} /> : null}
      </View>

      <Text className="flex-1 font-cuerpo text-[12.5px] leading-[18px] text-organic-neutral-700">
        {etiqueta}
      </Text>
    </Pressable>
  );
}
