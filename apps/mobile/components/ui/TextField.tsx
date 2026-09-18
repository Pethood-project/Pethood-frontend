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
  /** Letra más grande de etiqueta y valor, para el alta y la publicación de mascota. */
  grande?: boolean;
}

export function TextField({
  label,
  obligatorio,
  error,
  ayuda,
  variante,
  grande,
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
      grande={grande}
    >
      <TextInput
        className={`${claseValor(Boolean(error), !value, grande)} p-0`}
        placeholderTextColor={PALETA.gris[400]}
        value={value}
        {...inputProps}
      />
    </FormField>
  );
}
