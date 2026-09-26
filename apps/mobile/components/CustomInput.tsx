import { Pressable, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';

import { PALETA } from '@/constants/theme';

export interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  containerClassName?: string;
  /**
   * Paleta Organic de los artboards 01 y 02 (ingreso y registro): caja crema `neutral-100`
   * con borde `neutral-300`, esquinas más redondas y letra más grande. Sin esto se ve como
   * siempre (caja blanca, grises de Tailwind), que es lo que usan el resto de las pantallas.
   */
  organic?: boolean;
}

/** Clases por paleta. Tenerlas juntas evita mezclar tonos de una y otra en un mismo campo. */
const ESTILOS = {
  clasico: {
    etiqueta: 'mb-2 text-sm font-medium text-gray-700',
    asterisco: 'font-semibold text-pethood-orange',
    caja: 'rounded-xl bg-white',
    borde: 'border-gray-200',
    texto: 'py-3.5 text-base text-gray-900',
    placeholder: PALETA.gris[400],
  },
  organic: {
    etiqueta: 'mb-2 font-cuerpo-semi text-[15px] text-organic-neutral-700',
    asterisco: 'text-organic-accent-600',
    caja: 'rounded-[20px] bg-organic-neutral-100',
    borde: 'border-organic-neutral-300',
    texto: 'py-4 font-cuerpo text-[17px] text-organic-neutral-900',
    placeholder: PALETA.neutral[500],
  },
};

export function CustomInput({
  label,
  error,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName = '',
  organic = false,
  className = '',
  ...textInputProps
}: CustomInputProps) {
  const hasError = Boolean(error);
  const estilo = ESTILOS[organic ? 'organic' : 'clasico'];

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text
        className={estilo.etiqueta}
        accessibilityLabel={required ? `${label}, obligatorio` : label}
      >
        {label}
        {required ? <Text className={estilo.asterisco}> *</Text> : null}
      </Text>

      <View
        className={`flex-row items-center border px-4 ${estilo.caja} ${
          hasError ? 'border-red-400' : estilo.borde
        }`}
      >
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}

        <TextInput
          className={`flex-1 ${estilo.texto} ${className}`}
          placeholderTextColor={estilo.placeholder}
          accessibilityLabel={required ? `${label}, obligatorio` : label}
          {...textInputProps}
        />

        {rightIcon ? (
          onRightIconPress ? (
            <Pressable
              onPress={onRightIconPress}
              hitSlop={8}
              accessibilityRole="button"
            >
              {rightIcon}
            </Pressable>
          ) : (
            <View>{rightIcon}</View>
          )
        ) : null}
      </View>

      {hasError ? (
        <Text className="mt-1.5 text-sm text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
