/**
 * Fila de pastillas de selección única donde `undefined` es una opción válida: representa
 * "sin filtrar". La usan los filtros de búsqueda, que no tienen un valor por defecto sino
 * la ausencia de valor.
 */
import { View } from 'react-native';

import { Chip, type VarianteChip } from './Chip';

export interface OpcionSelector<T> {
  valor: T;
  etiqueta: string;
}

interface SelectorChipsProps<T> {
  opciones: OpcionSelector<T>[];
  valor: T | undefined;
  onChange: (valor: T | undefined) => void;
  /** Texto de la pastilla que limpia la selección. Si se omite, no se muestra. */
  etiquetaSinFiltro?: string;
  /** Distingue las claves cuando hay varios selectores en la misma pantalla. */
  prefijo: string;
  /** `filtro` es la paleta Organic de la pantalla 33. Por defecto, la naranja clásica. */
  variante?: Extract<VarianteChip, 'seleccion' | 'filtro'>;
  /** Chips más grandes (letra y área de toque). Ver `Chip.amplio`. */
  amplio?: boolean;
}

export function SelectorChips<T extends string | number>({
  opciones,
  valor,
  onChange,
  etiquetaSinFiltro,
  prefijo,
  variante = 'seleccion',
  amplio = false,
}: SelectorChipsProps<T>) {
  return (
    <View className={`flex-row flex-wrap ${amplio ? 'gap-2.5' : 'gap-2'}`}>
      {etiquetaSinFiltro ? (
        <Chip
          etiqueta={etiquetaSinFiltro}
          variante={variante}
          amplio={amplio}
          activa={valor === undefined}
          onPress={() => onChange(undefined)}
        />
      ) : null}

      {opciones.map((opcion) => (
        <Chip
          key={`${prefijo}-${opcion.valor}`}
          etiqueta={opcion.etiqueta}
          variante={variante}
          amplio={amplio}
          activa={valor === opcion.valor}
          onPress={() => onChange(opcion.valor)}
        />
      ))}
    </View>
  );
}
