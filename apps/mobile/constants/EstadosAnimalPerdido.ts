/**
 * Color de cada estado del aviso de mascota perdida (HU-13.1), en un solo lugar (mismo
 * patrón que EstadosMascota.ts).
 *
 * Perdido sale de la pantalla 06 del diseño: amarillo claro con la tinta `accent-800`.
 * Encontrado era crema en el diseño, pero sobre la tarjeta del aviso en el chat (también crema)
 * no se distinguía: pasó a celeste, que además no se confunde con el amarillo de Perdido ni con
 * el gris de Resuelto (decisión del 2026-10-04). Resuelto no está en el diseño: va apagado, en
 * neutros, para que se lea como un caso cerrado (decisión del 2026-09-29).
 *
 * Las claves son los nombres del catálogo `Estado_Animal_Perdido` del backend. Un estado
 * nuevo sin entrada propia cae al estilo neutro.
 */
import type { EstiloEstado } from './EstadosMascota';

const ESTILOS: Record<string, EstiloEstado> = {
  Perdido: {
    fondo: 'bg-organic-calido-amarilloClaro border-organic-calido-amarilloClaro',
    texto: 'text-organic-accent-800',
    etiqueta: 'Perdido',
  },
  Encontrado: {
    fondo: 'bg-sky-100 border-sky-200',
    texto: 'text-sky-800',
    etiqueta: 'Encontrado',
  },
  Resuelto: {
    fondo: 'bg-organic-neutral-200 border-organic-neutral-200',
    texto: 'text-organic-neutral-600',
    etiqueta: 'Resuelto',
  },
};

/**
 * La marca del caso cerrado (HU-13.2), con el texto exacto del criterio de aceptación.
 *
 * Va **además** del badge "Resuelto" y no en su lugar: el badge dice el estado y esto dice
 * qué pasó, que es lo que la HU pide mostrar. La usan la tarjeta de la grilla y el popup de
 * detalle, y vive acá para que las dos lean el mismo texto sin importarse entre sí.
 */
export const LEYENDA_RESUELTO = 'Volvió con su dueño';

export function estiloDeEstadoAnimalPerdido(nombre: string): EstiloEstado {
  return (
    ESTILOS[nombre] ?? {
      fondo: 'bg-organic-neutral-100 border-organic-neutral-100',
      texto: 'text-organic-neutral-700',
      etiqueta: nombre.replace(/_/g, ' '),
    }
  );
}
