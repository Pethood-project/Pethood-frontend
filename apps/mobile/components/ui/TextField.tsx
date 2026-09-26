import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { usePaletaFormulario } from './FormCard';
import { claseValor, colorPlaceholder, FormField, type VarianteCampo } from './FormField';

interface TextFieldProps extends Omit<TextInputProps, 'className'> {
  label: string;
  obligatorio?: boolean;
  error?: string;
  ayuda?: string;
  variante?: VarianteCampo;
  /** Letra más grande de etiqueta y valor, para el alta y la publicación de mascota. */
  grande?: boolean;
  /** Lapicito junto a la etiqueta, para marcar que el campo se puede editar (perfil). */
  lapiz?: boolean;
}

export function TextField({
  label,
  obligatorio,
  error,
  ayuda,
  variante,
  grande,
  lapiz,
  value,
  ...inputProps
}: TextFieldProps) {
  const paleta = usePaletaFormulario();

  return (
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      ayuda={ayuda}
      variante={variante}
      grande={grande}
      lapiz={lapiz}
    >
      <TextInput
        className={`${claseValor(Boolean(error), !value, grande, paleta)} p-0`}
        placeholderTextColor={colorPlaceholder(paleta)}
        value={value}
        {...inputProps}
      />
    </FormField>
  );
}
