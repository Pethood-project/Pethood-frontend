/** Campo de texto largo, con contador de caracteres. */
import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { claseValor, FormField, type VarianteCampo } from './FormField';
import { PALETA } from '@/constants/theme';

interface TextAreaFieldProps extends Omit<TextInputProps, 'className' | 'multiline'> {
  label: string;
  obligatorio?: boolean;
  error?: string;
  maximo: number;
  value: string;
  variante?: VarianteCampo;
  /** Texto a la izquierda del contador, por ejemplo el mínimo exigido. */
  ayuda?: string;
  /** Alto mínimo del área editable. El default alcanza para dos o tres renglones. */
  altoMinimo?: number;
}

export function TextAreaField({
  label,
  obligatorio,
  error,
  maximo,
  value,
  variante,
  ayuda,
  altoMinimo = 72,
  ...inputProps
}: TextAreaFieldProps) {
  return (
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      variante={variante}
      ayuda={ayuda}
      ayudaDerecha={`${value.trim().length} / ${maximo}`}
    >
      <TextInput
        className={`${claseValor(Boolean(error), !value)} p-0`}
        style={{ minHeight: altoMinimo }}
        placeholderTextColor={PALETA.gris[400]}
        multiline
        textAlignVertical="top"
        maxLength={maximo}
        value={value}
        {...inputProps}
      />
    </FormField>
  );
}
