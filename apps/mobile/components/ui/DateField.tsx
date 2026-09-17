/**
 * Campo de fecha para web: `@react-native-community/datetimepicker` no tiene implementación
 * de web (su fallback genérico no renderiza nada), así que acá se usa el `<input type="date">`
 * nativo del navegador, igual que ya hace `FechaNacimientoPicker.tsx`. La contraparte para
 * iOS/Android vive en `DateField.native.tsx`.
 */
import { aFechaISO, edadEnTexto, parsearFecha } from '../../shared/validation/dates';
import { LIMITES } from '../../shared/validation/limits';
import { FormField, type VarianteCampo } from './FormField';

interface DateFieldProps {
  label: string;
  placeholder: string;
  valor: Date | null;
  onChange: (fecha: Date) => void;
  obligatorio?: boolean;
  error?: string;
  onBlur?: () => void;
  /** Por defecto hoy: la mayoría de las fechas del dominio no pueden ser futuras. */
  fechaMaxima?: Date;
  /** Para campos de "próxima fecha", que exigen posterior a hoy. */
  fechaMinima?: Date;
  /** Solo tiene sentido para fecha de nacimiento; el resto de los campos de fecha no la muestran. */
  mostrarEdad?: boolean;
  variante?: VarianteCampo;
  /** Letra más grande de etiqueta y valor, para el alta y la publicación de mascota. */
  grande?: boolean;
}

export function DateField({
  label,
  placeholder,
  valor,
  onChange,
  obligatorio,
  error,
  onBlur,
  fechaMaxima = new Date(),
  fechaMinima = new Date(LIMITES.fecha.anioMinimo, 0, 1),
  mostrarEdad = true,
  variante,
  grande,
}: DateFieldProps) {
  return (
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      ayuda={mostrarEdad && valor ? edadEnTexto(valor) : undefined}
      variante={variante}
      grande={grande}
    >
      <input
        type="date"
        aria-label={label}
        placeholder={placeholder}
        value={valor ? aFechaISO(valor) : ''}
        min={aFechaISO(fechaMinima)}
        max={aFechaISO(fechaMaxima)}
        onChange={(evento) => {
          const fecha = parsearFecha(evento.target.value);
          if (fecha) onChange(fecha);
        }}
        onBlur={onBlur}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: 0,
          fontSize: grande ? 18 : 16,
          fontFamily: 'inherit',
          color: error ? '#EF4444' : valor ? '#1F2937' : '#9CA3AF',
        }}
      />
    </FormField>
  );
}
