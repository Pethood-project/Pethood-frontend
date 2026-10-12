/**
 * Color de cada estado de mascota, en un solo lugar.
 *
 * Las claves son los nombres tal como los devuelve el catálogo del backend (con guiones
 * bajos). Si se agrega un estado nuevo allá, sumarlo acá: sin entrada propia cae al
 * estilo neutro, que se ve bien igual pero no comunica nada.
 */
export interface EstiloEstado {
  /** Fondo y borde de la pastilla. */
  fondo: string;
  /** Color del texto. */
  texto: string;
  /** Etiqueta legible, sin los guiones bajos del catálogo. */
  etiqueta: string;
}

const ESTILOS: Record<string, EstiloEstado> = {
  Disponible: {
    fondo: 'bg-emerald-50 border-emerald-200',
    texto: 'text-emerald-700',
    etiqueta: 'Disponible',
  },
  En_Tratamiento: {
    fondo: 'bg-rose-50 border-rose-200',
    texto: 'text-rose-700',
    etiqueta: 'En tratamiento',
  },
  En_Transito: {
    fondo: 'bg-amber-50 border-amber-200',
    texto: 'text-amber-700',
    etiqueta: 'En tránsito',
  },
  Adoptado: {
    fondo: 'bg-sky-50 border-sky-200',
    texto: 'text-sky-700',
    etiqueta: 'Adoptado',
  },
  Fallecido: {
    fondo: 'bg-gray-100 border-gray-300',
    texto: 'text-gray-500',
    etiqueta: 'Fallecido',
  },
};

/** "Adoptado" cuando la adoptó el usuario que mira: verde suave. */
const ESTILO_ADOPTADA_POR_MI: EstiloEstado = {
  fondo: 'bg-emerald-50 border-emerald-200',
  texto: 'text-emerald-700',
  etiqueta: 'Adoptado',
};

/** El estado sigue siendo "Adoptado", pero para quien mira la adoptó otra persona. */
const ESTILO_ADOPTADA_POR_OTRO: EstiloEstado = {
  fondo: 'bg-gray-100 border-gray-300',
  texto: 'text-gray-600',
  etiqueta: 'No disponible',
};

/**
 * `adoptadaPorMi` solo se pasa donde el backend lo informa (hoy, favoritos): con el estado
 * "Adoptado" no alcanza para saber si la adoptó quien mira o alguien más. Sin el dato, se
 * muestra el estilo de siempre.
 */
export function estiloDeEstado(nombre: string, adoptadaPorMi?: boolean): EstiloEstado {
  if (nombre === 'Adoptado' && adoptadaPorMi !== undefined) {
    return adoptadaPorMi ? ESTILO_ADOPTADA_POR_MI : ESTILO_ADOPTADA_POR_OTRO;
  }

  return (
    ESTILOS[nombre] ?? {
      fondo: 'bg-gray-100 border-gray-200',
      texto: 'text-gray-600',
      etiqueta: nombre.replace(/_/g, ' '),
    }
  );
}
