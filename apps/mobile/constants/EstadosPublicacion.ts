/**
 * Color de cada estado de publicación, en un solo lugar (mismo patrón que EstadosMascota.ts).
 *
 * Es el estado del AVISO, no el de la mascota. Las claves son los nombres tal como los
 * devuelve el catálogo `Estado_Publicacion` del backend. Si se agrega un estado nuevo allá,
 * sumarlo acá: sin entrada propia cae al estilo neutro.
 */
import type { EstiloEstado } from './EstadosMascota';

const ESTILOS: Record<string, EstiloEstado> = {
  Activa: {
    fondo: 'bg-emerald-50 border-emerald-200',
    texto: 'text-emerald-700',
    etiqueta: 'Activa',
  },
  Pausada: {
    fondo: 'bg-amber-50 border-amber-200',
    texto: 'text-amber-700',
    etiqueta: 'Pausada',
  },
  Finalizada: {
    fondo: 'bg-gray-100 border-gray-300',
    texto: 'text-gray-500',
    etiqueta: 'Finalizada',
  },
};

export function estiloDeEstadoPublicacion(nombre: string): EstiloEstado {
  return (
    ESTILOS[nombre] ?? {
      fondo: 'bg-gray-100 border-gray-200',
      texto: 'text-gray-600',
      etiqueta: nombre.replace(/_/g, ' '),
    }
  );
}
