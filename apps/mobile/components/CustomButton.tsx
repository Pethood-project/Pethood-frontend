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

/**
 * Forma del botón del artboard 23 (radio 15 sobre 262px, ×1,33 ≈ 20). Va por `style` y no
 * por clase: sumar `rounded-[20px]` al `rounded-2xl` de base deja dos radios en conflicto.
 */
export const FORMA_BOTON_ORGANIC = { borderRadius: 20 };

/** El principal del artboard 23 además lleva sombra: `0 6px 16px rgba(100,51,18,.26)`. */
export const FORMA_BOTON_ORGANIC_PRINCIPAL = {
  ...FORMA_BOTON_ORGANIC,
  shadowColor: PALETA.accent[800],
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.26,
  shadowRadius: 16,
  elevation: 6,
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
  /** Más alto y con letra más grande: las pantallas de ingreso (artboards 01 y 02). */
  grande?: boolean;
}

export function CustomButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  onPress,
  onPressDeshabilitado,
  grande = false,
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
      className={`w-full items-center justify-center rounded-2xl ${grande ? 'py-[18px]' : 'py-4'} ${estilo.contenedor} ${
        isDisabled ? 'opacity-60' : ''
      } ${className}`}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={estilo.spinner} />
      ) : (
        <Text className={`${grande ? 'text-lg' : 'text-base'} font-semibold ${estilo.texto}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
