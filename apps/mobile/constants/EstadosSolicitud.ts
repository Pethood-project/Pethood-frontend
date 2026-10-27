/**
 * Color y rótulo de cada estado de solicitud, en un solo lugar (mismo patrón que
 * EstadosMascota.ts).
 *
 * Las claves son los nombres tal como los devuelve el catálogo del backend (con guiones
 * bajos, ver `EstadoSolicitudNombre` en `services/solicitudes.ts`).
 *
 * El rótulo depende de quién mira: el nombre del catálogo es el mismo, pero a quien envió la
 * solicitud no le sirve leer "Pendiente" ni "Rechazada" (suena a sentencia), y a quien la
 * recibe, "Enviada" no le dice qué tiene que hacer.
 */
import type { EstadoSolicitudNombre } from '@/services/solicitudes';

import type { EstiloEstado } from './EstadosMascota';

/** Desde qué lado se mira la solicitud. */
export type VistaSolicitud = 'adoptante' | 'refugio';

const ESTILOS: Record<EstadoSolicitudNombre, Omit<EstiloEstado, 'etiqueta'>> = {
  Pendiente: { fondo: 'bg-amber-50 border-amber-200', texto: 'text-amber-700' },
  En_Revision: { fondo: 'bg-sky-50 border-sky-200', texto: 'text-sky-700' },
  Revisada: { fondo: 'bg-teal-50 border-teal-200', texto: 'text-teal-700' },
  Aprobada: { fondo: 'bg-emerald-50 border-emerald-200', texto: 'text-emerald-700' },
  Rechazada: { fondo: 'bg-rose-50 border-rose-200', texto: 'text-rose-700' },
  Cancelada: { fondo: 'bg-gray-100 border-gray-300', texto: 'text-gray-500' },
  Cerrada: { fondo: 'bg-stone-100 border-stone-300', texto: 'text-stone-600' },
};

const ETIQUETAS: Record<EstadoSolicitudNombre, Record<VistaSolicitud, string>> = {
  Pendiente: { adoptante: 'Enviada', refugio: 'Por revisar' },
  En_Revision: { adoptante: 'En revisión', refugio: 'En revisión' },
  Revisada: { adoptante: 'Revisada', refugio: 'Revisada' },
  Aprobada: { adoptante: 'Aprobada', refugio: 'Aprobada' },
  Rechazada: { adoptante: 'No aceptada', refugio: 'Rechazada' },
  Cancelada: { adoptante: 'Cancelada', refugio: 'Cancelada' },
  Cerrada: { adoptante: 'Cerrada', refugio: 'Cerrada' },
};

function esEstadoConocido(nombre: string): nombre is EstadoSolicitudNombre {
  return nombre in ESTILOS;
}

export function etiquetaEstadoSolicitud(nombre: string, vista: VistaSolicitud = 'refugio'): string {
  return esEstadoConocido(nombre) ? ETIQUETAS[nombre][vista] : nombre.replace(/_/g, ' ');
}

export function estiloDeEstadoSolicitud(
  nombre: string,
  vista: VistaSolicitud = 'refugio',
): EstiloEstado {
  if (!esEstadoConocido(nombre)) {
    return {
      fondo: 'bg-gray-100 border-gray-200',
      texto: 'text-gray-600',
      etiqueta: etiquetaEstadoSolicitud(nombre, vista),
    };
  }

  return { ...ESTILOS[nombre], etiqueta: ETIQUETAS[nombre][vista] };
}
