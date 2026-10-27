/**
 * Filtro por estado para los listados del refugio ("Mascotas del refugio", "Publicaciones del
 * refugio", "Mis Campañas"): "Todos" más una pastilla por estado, de selección múltiple. Va
 * dentro de la pantalla de filtros (`FiltroEstadosBoton`, `ModalFiltros`) y no suelto en el
 * listado, donde ocupaba un renglón entero.
 *
 * La selección vacía es "Todos" — así viaja al backend, que sin `?estados=` no filtra. Elegir
 * todos los estados uno por uno equivale a lo mismo, así que se colapsa a "Todos" en vez de
 * dejar todo marcado y "Todos" apagado.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Chip } from './Chip';
import { BotonCircular } from './BotonCircular';
import { ModalFiltros, SeccionFiltro } from './ModalFiltros';

export interface OpcionEstado {
  id: number;
  etiqueta: string;
}

interface PastillasEstadosProps {
  opciones: OpcionEstado[];
  /** Ids elegidos. Vacío = "Todos". */
  seleccionados: number[];
  onChange: (seleccionados: number[]) => void;
}

/** Las pastillas solas, para armar una sección dentro de una pantalla de filtros. */
export function PastillasEstados({ opciones, seleccionados, onChange }: PastillasEstadosProps) {
  const alternar = (id: number): void => {
    const siguiente = seleccionados.includes(id)
      ? seleccionados.filter((elegido) => elegido !== id)
      : [...seleccionados, id];

    onChange(siguiente.length === opciones.length ? [] : siguiente);
  };

  return (
    <View className="flex-row flex-wrap gap-2.5">
      <Chip
        etiqueta="Todos"
        variante="filtro"
        rol="radio"
        amplio
        activa={seleccionados.length === 0}
        onPress={() => onChange([])}
      />

      {opciones.map((opcion) => (
        <Chip
          key={opcion.id}
          etiqueta={opcion.etiqueta}
          variante="filtro"
          rol="checkbox"
          amplio
          activa={seleccionados.includes(opcion.id)}
          onPress={() => alternar(opcion.id)}
        />
      ))}
    </View>
  );
}

interface FiltroEstadosBotonProps extends PastillasEstadosProps {
  /** Rótulo de la sección ("Estado de la mascota"). */
  titulo?: string;
}

/**
 * El ícono de deslizadores para el encabezado: con la cantidad de estados elegidos encima, y
 * al tocarlo abre la pantalla de filtros. No ocupa ningún renglón del listado.
 */
export function FiltroEstadosBoton({
  opciones,
  seleccionados,
  onChange,
  titulo = 'Estado',
}: FiltroEstadosBotonProps) {
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<number[]>(seleccionados);

  // Al abrir se descarta cualquier borrador anterior: lo que se ve es lo que está aplicado.
  useEffect(() => {
    if (abierto) setBorrador(seleccionados);
  }, [abierto, seleccionados]);

  return (
    <>
      <BotonCircular
        icono="options-outline"
        etiqueta="Filtros"
        contador={seleccionados.length}
        onPress={() => setAbierto(true)}
      />

      <ModalFiltros
        visible={abierto}
        activos={borrador.length > 0 ? 1 : 0}
        onLimpiar={() => setBorrador([])}
        onAplicar={() => {
          onChange(borrador);
          setAbierto(false);
        }}
        onCerrar={() => setAbierto(false)}
      >
        <SeccionFiltro titulo={titulo} ayuda="Podés elegir más de uno.">
          <PastillasEstados opciones={opciones} seleccionados={borrador} onChange={setBorrador} />
        </SeccionFiltro>
      </ModalFiltros>
    </>
  );
}
