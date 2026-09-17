/**
 * Color de cada estado de solicitud, en un solo lugar (mismo patrón que EstadosMascota.ts).
 *
 * Las claves son los nombres tal como los devuelve el catálogo del backend (con guiones
 * bajos, ver `EstadoSolicitudNombre` en `services/solicitudes.ts`).
 */
import type { EstiloEstado } from './EstadosMascota';

const ESTILOS: Record<string, EstiloEstado> = {
  Pendiente: {
    fondo: 'bg-amber-50 border-amber-200',
    texto: 'text-amber-700',
    etiqueta: 'Pendiente',
  },
  En_Revision: {
    fondo: 'bg-sky-50 border-sky-200',
    texto: 'text-sky-700',
    etiqueta: 'En revisión',
  },
  Aprobada: {
    fondo: 'bg-emerald-50 border-emerald-200',
    texto: 'text-emerald-700',
    etiqueta: 'Aprobada',
  },
  Rechazada: {
    fondo: 'bg-rose-50 border-rose-200',
    texto: 'text-rose-700',
    etiqueta: 'Rechazada',
  },
  Cancelada: {
    fondo: 'bg-gray-100 border-gray-300',
    texto: 'text-gray-500',
    etiqueta: 'Cancelada',
  },
};

export function estiloDeEstadoSolicitud(nombre: string): EstiloEstado {
  return (
    ESTILOS[nombre] ?? {
      fondo: 'bg-gray-100 border-gray-200',
      texto: 'text-gray-600',
      etiqueta: nombre.replace(/_/g, ' '),
    }
  );
}
