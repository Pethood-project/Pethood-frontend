/** Campo de texto largo, con contador de caracteres. */
import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { usePaletaFormulario } from './FormCard';
import { claseValor, colorPlaceholder, FormField, type VarianteCampo } from './FormField';

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
  /** Letra más grande de etiqueta y valor, para el alta y la publicación de mascota. */
  grande?: boolean;
  /** Lapicito junto a la etiqueta, para marcar que el campo se puede editar (perfil). */
  lapiz?: boolean;
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
  grande,
  lapiz,
  ...inputProps
}: TextAreaFieldProps) {
  const paleta = usePaletaFormulario();

  return (
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      variante={variante}
      ayuda={ayuda}
      ayudaDerecha={`${value.trim().length} / ${maximo}`}
      grande={grande}
      lapiz={lapiz}
    >
      <TextInput
        className={`${claseValor(Boolean(error), !value, grande, paleta)} p-0`}
        style={{ minHeight: altoMinimo }}
        placeholderTextColor={colorPlaceholder(paleta)}
        multiline
        textAlignVertical="top"
        maxLength={maximo}
        value={value}
        {...inputProps}
      />
    </FormField>
  );
}
