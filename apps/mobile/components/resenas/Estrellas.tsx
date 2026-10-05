/**
 * Fila de cinco estrellas. Es la base visual de toda la reputación (Módulo 10): se usa para
 * mostrar una puntuación y, en modo interactivo, para elegirla en el modal de reseña.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface EstrellasProps {
  /** Puntuación a mostrar o valor elegido (0 a 5). */
  valor: number;
  tamanio?: number;
  /** Con `interactivo`, cada estrella responde al toque y llama a `onChange`. */
  interactivo?: boolean;
  onChange?: (valor: number) => void;
  /** Etiqueta de accesibilidad del grupo, para el lector de pantalla. */
  etiqueta?: string;
}

export function Estrellas({
  valor,
  tamanio = 18,
  interactivo = false,
  onChange,
  etiqueta,
}: EstrellasProps) {
  return (
    <View className="flex-row items-center gap-0.5" accessibilityLabel={etiqueta} accessibilityRole="text">
      {[1, 2, 3, 4, 5].map((n) => {
        // Al mostrar se redondea; al elegir, la estrella N se pinta con N o más.
        const llena = interactivo ? n <= valor : n <= Math.round(valor);
        const color = llena ? PALETA.calido.amarillo : PALETA.neutral[400];
        const icono = llena ? 'star' : 'star-outline';

        if (!interactivo) {
          return <Ionicons key={n} name={icono} size={tamanio} color={color} />;
        }

        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            accessibilityState={{ selected: n <= valor }}
            hitSlop={4}
            onPress={() => onChange?.(n)}
            className="p-0.5 active:opacity-60"
          >
            <Ionicons name={icono} size={tamanio} color={color} />
          </Pressable>
        );
      })}
    </View>
  );
}
