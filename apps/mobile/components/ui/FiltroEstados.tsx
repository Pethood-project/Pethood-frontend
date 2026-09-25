/**
 * Filtro por estado para los listados del refugio ("Mascotas del refugio", "Publicaciones del
 * refugio"): una fila de chips con "Todos" más uno por estado, de selección múltiple.
 *
 * La selección vacía es "Todos" — así viaja al backend, que sin `?estados=` no filtra. Elegir
 * todos los estados uno por uno equivale a lo mismo, así que se colapsa a "Todos" en vez de
 * dejar la fila con todo marcado y "Todos" apagado.
 */
import { ScrollView } from 'react-native';

import { Chip } from './Chip';

export interface OpcionEstado {
  id: number;
  etiqueta: string;
}

interface FiltroEstadosProps {
  opciones: OpcionEstado[];
  /** Ids elegidos. Vacío = "Todos". */
  seleccionados: number[];
  onChange: (seleccionados: number[]) => void;
}

export function FiltroEstados({ opciones, seleccionados, onChange }: FiltroEstadosProps) {
  const alternar = (id: number): void => {
    const siguiente = seleccionados.includes(id)
      ? seleccionados.filter((elegido) => elegido !== id)
      : [...seleccionados, id];

    onChange(siguiente.length === opciones.length ? [] : siguiente);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="items-center gap-2.5 px-[22px] pb-3.5"
      // Sin esto, en Android el ScrollView horizontal se estira a todo el alto disponible.
      className="flex-grow-0"
    >
      <Chip
        etiqueta="Todos"
        variante="multiple"
        rol="radio"
        amplio
        activa={seleccionados.length === 0}
        onPress={() => onChange([])}
      />

      {opciones.map((opcion) => (
        <Chip
          key={opcion.id}
          etiqueta={opcion.etiqueta}
          variante="multiple"
          rol="checkbox"
          amplio
          activa={seleccionados.includes(opcion.id)}
          onPress={() => alternar(opcion.id)}
        />
      ))}
    </ScrollView>
  );
}
