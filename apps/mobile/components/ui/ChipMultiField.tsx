/** Pastillas de selección múltiple: se marcan y desmarcan tocándolas. */
import { View } from 'react-native';
import { Chip } from './Chip';
import { FormField } from './FormField';

interface ChipMultiFieldProps {
  label: string;
  opciones: string[];
  seleccionadas: string[];
  onChange: (seleccionadas: string[]) => void;
  /** Tope opcional de cuántas se pueden marcar a la vez. */
  maximo?: number;
  error?: string;
}

export function ChipMultiField({
  label,
  opciones,
  seleccionadas,
  onChange,
  maximo,
  error,
}: ChipMultiFieldProps) {
  const alternar = (opcion: string): void => {
    if (seleccionadas.includes(opcion)) {
      onChange(seleccionadas.filter((actual) => actual !== opcion));
      return;
    }

    if (maximo && seleccionadas.length >= maximo) return;
    onChange([...seleccionadas, opcion]);
  };

  const ayuda = maximo ? `${seleccionadas.length} de ${maximo}` : undefined;

  return (
    <FormField label={label} error={error} ayuda={ayuda}>
      <View className="mt-1 flex-row flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activa = seleccionadas.includes(opcion);

          return (
            <Chip
              key={opcion}
              etiqueta={opcion}
              variante="multiple"
              rol="checkbox"
              activa={activa}
              deshabilitada={!activa && Boolean(maximo) && seleccionadas.length >= maximo!}
              onPress={() => alternar(opcion)}
            />
          );
        })}
      </View>
    </FormField>
  );
}
