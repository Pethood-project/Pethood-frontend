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
}

export function CustomInput({
  label,
  error,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName = '',
  className = '',
  ...textInputProps
}: CustomInputProps) {
  const hasError = Boolean(error);

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text
        className="mb-2 text-sm font-medium text-gray-700"
        accessibilityLabel={required ? `${label}, obligatorio` : label}
      >
        {label}
        {required ? <Text className="font-semibold text-pethood-orange"> *</Text> : null}
      </Text>

      <View
        className={`flex-row items-center rounded-xl border bg-white px-4 ${
          hasError ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}

        <TextInput
          className={`flex-1 py-3.5 text-base text-gray-900 ${className}`}
          placeholderTextColor={PALETA.gris[400]}
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
