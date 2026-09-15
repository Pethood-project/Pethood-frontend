/**
 * Cabecera de un formulario por pasos: volver, "PASO N DE T", título, cerrar y la barra de
 * segmentos que marca cuánto falta.
 *
 * Los segmentos son uno por paso y no una barra continua a propósito: con pocos pasos, ver
 * cuántos quedan es más útil que ver un porcentaje.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface BarraPasosProps {
  /** Base 1: el primer paso es el 1, no el 0. */
  paso: number;
  total: number;
  titulo: string;
  /** Sin handler, la flecha de volver no se muestra. */
  onVolver?: () => void;
  onCerrar: () => void;
}

export function BarraPasos({ paso, total, titulo, onVolver, onCerrar }: BarraPasosProps) {
  return (
    // zIndex: en web todos los View nacen con z-index 0 y el ScrollView del paso
    // (una adopción no tiene período y el contenido es más corto) pinta encima
    // y se come los toques de la flecha.
    <View
      className="border-b border-organic-neutral-200 bg-organic-bg px-4 pb-3 pt-2"
      style={{ zIndex: 2 }}
    >
      <View className="flex-row items-center gap-2.5">
        {onVolver ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onVolver}
            hitSlop={12}
            pointerEvents="auto"
            className="h-10 w-10 items-center justify-center active:opacity-60"
          >
            <Ionicons name="arrow-back" size={20} color={PALETA.accent[700]} />
          </Pressable>
        ) : (
          // Hueco del mismo ancho que la flecha: sin esto el título salta al pasar del
          // primer paso al segundo.
          <View className="h-10 w-10" />
        )}

        <View className="flex-1">
          <Text className="font-cuerpo-semi text-[10.5px] uppercase tracking-[1.2px] text-organic-accent-500">
            Paso {paso} de {total}
          </Text>
          <Text className="font-titulo text-[19px] leading-[26px] text-organic-accent-700">
            {titulo}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar la solicitud"
          onPress={onCerrar}
          hitSlop={10}
          className="active:opacity-60"
        >
          <Ionicons name="close" size={22} color={PALETA.neutral[500]} />
        </Pressable>
      </View>

      <View
        className="mt-2.5 flex-row gap-1.5"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: paso }}
      >
        {Array.from({ length: total }, (_, indice) => (
          <View
            key={indice}
            className={`h-1 flex-1 rounded-full ${
              indice < paso ? 'bg-organic-accent-600' : 'bg-organic-neutral-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
