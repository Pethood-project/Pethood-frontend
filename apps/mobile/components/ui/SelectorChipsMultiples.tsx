/**
 * Fila de pastillas de selección MÚLTIPLE para filtros, hermana de `SelectorChips` (que es de
 * selección única). La lista vacía es "sin filtrar" y la representa la pastilla
 * `etiquetaSinFiltro` ("Todos"); elegir todas las opciones una por una equivale a lo mismo,
 * así que se colapsa a la lista vacía en vez de dejar todo marcado y "Todos" apagado.
 */
import { View } from 'react-native';

import { Chip, type VarianteChip } from './Chip';
import type { OpcionSelector } from './SelectorChips';

interface SelectorChipsMultiplesProps<T> {
  opciones: OpcionSelector<T>[];
  /** Valores elegidos. Vacío = sin filtrar. */
  valores: T[];
  onChange: (valores: T[]) => void;
  /** Texto de la pastilla que limpia la selección ("Todos"). */
  etiquetaSinFiltro: string;
  /** Distingue las claves cuando hay varios selectores en la misma pantalla. */
  prefijo: string;
  /** `filtro` es la paleta Organic de la pantalla 33. */
  variante?: Extract<VarianteChip, 'seleccion' | 'filtro'>;
  /** Chips más grandes (letra y área de toque). Ver `Chip.amplio`. */
  amplio?: boolean;
}

export function SelectorChipsMultiples<T extends string | number>({
  opciones,
  valores,
  onChange,
  etiquetaSinFiltro,
  prefijo,
  variante = 'filtro',
  amplio = false,
}: SelectorChipsMultiplesProps<T>) {
  const alternar = (valor: T): void => {
    const siguientes = valores.includes(valor)
      ? valores.filter((elegido) => elegido !== valor)
      : [...valores, valor];

    onChange(siguientes.length === opciones.length ? [] : siguientes);
  };

  return (
    <View className={`flex-row flex-wrap ${amplio ? 'gap-2.5' : 'gap-2'}`}>
      <Chip
        etiqueta={etiquetaSinFiltro}
        variante={variante}
        amplio={amplio}
        rol="radio"
        activa={valores.length === 0}
        onPress={() => onChange([])}
      />

      {opciones.map((opcion) => (
        <Chip
          key={`${prefijo}-${opcion.valor}`}
          etiqueta={opcion.etiqueta}
          variante={variante}
          amplio={amplio}
          rol="checkbox"
          activa={valores.includes(opcion.valor)}
          onPress={() => alternar(opcion.valor)}
        />
      ))}
    </View>
  );
}
