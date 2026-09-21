/**
 * Campo de fecha con calendario nativo. `maximumDate` bloquea las fechas futuras desde el
 * propio calendario, para que ni siquiera se puedan elegir.
 */
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { aFechaVisible, edadEnTexto } from '../../shared/validation/dates';
import { LIMITES } from '../../shared/validation/limits';
import { claseValor, FormField, type VarianteCampo } from './FormField';
import { SelectorFechaIOS } from './SelectorFechaIOS';
import { PALETA } from '@/constants/theme';

interface DateFieldProps {
  label: string;
  placeholder: string;
  valor: Date | null;
  onChange: (fecha: Date) => void;
  obligatorio?: boolean;
  error?: string;
  /** Se avisa al cerrar el calendario: equivale a perder el foco de un input. */
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
  const [abierto, setAbierto] = useState(false);
  // Fecha con la que arranca el calendario si todavía no hay valor: hoy cuando entra en el
  // rango permitido, o el extremo más cercano cuando no (ej. "fecha próxima" es futura).
  const hoy = new Date();
  const fechaInicial = valor ?? (fechaMinima > hoy ? fechaMinima : fechaMaxima < hoy ? fechaMaxima : hoy);

  const cerrar = (): void => {
    setAbierto(false);
    onBlur?.();
  };

  return (
    <FormField
      label={label}
      obligatorio={obligatorio}
      error={error}
      ayuda={mostrarEdad && valor ? edadEnTexto(valor) : undefined}
      variante={variante}
      grande={grande}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${valor ? aFechaVisible(valor) : 'sin elegir'}`}
        onPress={() => setAbierto(true)}
        className="flex-row items-center"
      >
        <Text className={`flex-1 ${claseValor(Boolean(error), !valor, grande)}`}>
          {valor ? aFechaVisible(valor) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={grande ? 22 : 18} color={PALETA.gris[400]} />
      </Pressable>

      {/* En Android es un diálogo nativo y no ocupa lugar en el layout. En iOS el spinner
          embebido no tenía ancho suficiente para mostrar la rueda de año, así que se abre
          en un modal centrado aparte (SelectorFechaIOS). */}
      {abierto && Platform.OS === 'ios' ? (
        <SelectorFechaIOS
          visible={abierto}
          value={fechaInicial}
          minimumDate={fechaMinima}
          maximumDate={fechaMaxima}
          onChange={onChange}
          onCerrar={cerrar}
          pie={
            <Pressable accessibilityRole="button" onPress={cerrar}>
              <Text className={`font-semibold text-pethood-orange ${grande ? 'text-lg' : 'text-base'}`}>
                Listo
              </Text>
            </Pressable>
          }
        />
      ) : null}

      {abierto && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={fechaInicial}
          mode="date"
          display="default"
          maximumDate={fechaMaxima}
          minimumDate={fechaMinima}
          onValueChange={(_evento, fecha) => {
            cerrar();
            if (fecha) onChange(fecha);
          }}
          onDismiss={cerrar}
        />
      ) : null}
    </FormField>
  );
}
