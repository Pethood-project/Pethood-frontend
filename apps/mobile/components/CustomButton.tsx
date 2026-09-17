import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

import { PALETA } from '@/constants/theme';

/**
 * `primary`/`secondary` son el naranja de marca de los formularios viejos. Las tres
 * `acento`/`neutro` son del rediseño Organic (solicitud, carteles): mismo componente,
 * distinta paleta, para no tener dos botones que se comporten diferente.
 */
export type VarianteBoton = 'primary' | 'secondary' | 'acento' | 'acento-borde' | 'neutro';

/** Clases de fondo/borde y de texto por variante. */
const VARIANTES: Record<VarianteBoton, { contenedor: string; texto: string; spinner: string }> = {
  primary: {
    contenedor: 'bg-pethood-orange active:opacity-90',
    texto: 'text-white',
    spinner: PALETA.blanco,
  },
  secondary: {
    contenedor: 'border border-pethood-orange bg-transparent active:opacity-80',
    texto: 'text-pethood-orange',
    spinner: PALETA.pethood.naranja,
  },
  acento: {
    contenedor: 'bg-organic-accent-600 active:opacity-90',
    texto: 'text-white',
    spinner: PALETA.blanco,
  },
  'acento-borde': {
    contenedor: 'border border-organic-accent-600 bg-organic-surface active:opacity-80',
    texto: 'text-organic-accent-600',
    spinner: PALETA.accent[600],
  },
  neutro: {
    contenedor: 'border border-organic-neutral-300 bg-organic-surface active:opacity-80',
    texto: 'text-organic-neutral-700',
    spinner: PALETA.neutral[700],
  },
};

export interface CustomButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  loading?: boolean;
  variant?: VarianteBoton;
  /**
   * Se llama al tocar el botón mientras está deshabilitado, para poder explicar qué falta
   * en vez de no responder. Nunca dispara `onPress`.
   */
  onPressDeshabilitado?: () => void;
}

export function CustomButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  onPress,
  onPressDeshabilitado,
  className = '',
  ...pressableProps
}: CustomButtonProps) {
  const isDisabled = disabled || loading;
  const estilo = VARIANTES[variant];

  return (
    <Pressable
      accessibilityRole="button"
      // Se anuncia como deshabilitado, pero sigue recibiendo el toque para poder explicar
      // qué falta. Mientras carga sí se bloquea, para no reenviar el formulario.
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={loading}
      onPress={isDisabled ? onPressDeshabilitado : onPress}
      className={`w-full items-center justify-center rounded-2xl py-4 ${estilo.contenedor} ${
        isDisabled ? 'opacity-60' : ''
      } ${className}`}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={estilo.spinner} />
      ) : (
        <Text className={`text-base font-semibold ${estilo.texto}`}>{title}</Text>
      )}
    </Pressable>
  );
}
