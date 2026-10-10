/**
 * Color de cada estado de campaña (mismo patrón que EstadosPublicacion.ts). Las claves son los
 * nombres del catálogo `Estado_Campaña` del backend; uno nuevo sin entrada cae al neutro.
 */
import type { EstiloEstado } from './EstadosMascota';

const ESTILOS: Record<string, EstiloEstado> = {
  Inactiva: { fondo: 'bg-sky-50 border-sky-200', texto: 'text-sky-700', etiqueta: 'Programada' },
  Activa: {
    fondo: 'bg-emerald-50 border-emerald-200',
    texto: 'text-emerald-700',
    etiqueta: 'Activa',
  },
  Finalizada: {
    fondo: 'bg-gray-100 border-gray-300',
    texto: 'text-gray-500',
    etiqueta: 'Finalizada',
  },
  Cancelada: { fondo: 'bg-red-50 border-red-200', texto: 'text-red-700', etiqueta: 'Cancelada' },
};

export function estiloDeEstadoCampania(nombre: string): EstiloEstado {
  return (
    ESTILOS[nombre] ?? {
      fondo: 'bg-gray-100 border-gray-200',
      texto: 'text-gray-600',
      etiqueta: nombre,
    }
  );
}
