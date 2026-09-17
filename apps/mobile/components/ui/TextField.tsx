import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { claseValor, FormField, type VarianteCampo } from './FormField';
import { PALETA } from '@/constants/theme';

interface TextFieldProps extends Omit<TextInputProps, 'className'> {
  label: string;
  obligatorio?: boolean;
  error?: string;
  ayuda?: string;
  variante?: VarianteCampo;
}

export function TextField({
  label,
  obligatorio,
  error,
  ayuda,
  variante,
  value,
  ...inputProps
}: TextFieldProps) {
  return (
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      ayuda={ayuda}
      variante={variante}
    >
      <TextInput
        className={`${claseValor(Boolean(error), !value)} p-0`}
        placeholderTextColor={PALETA.gris[400]}
        value={value}
        {...inputProps}
      />
    </FormField>
  );
}
