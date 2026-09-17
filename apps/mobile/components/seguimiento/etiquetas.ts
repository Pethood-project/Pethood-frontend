/**
 * Textos de UI del seguimiento post-adopción que comparten el listado y GUI-21.
 *
 * `Tipo_Solicitud.nombre` viaja como está en el catálogo del backend ("Adopcion",
 * "Transito", sin tilde): no se muestra crudo, se traduce acá. Vive fuera de las pantallas
 * para que las dos digan lo mismo — no en `services/seguimiento.ts`, que igual que el resto
 * de los servicios es sólo cliente de la API y no tiene texto de interfaz.
 */
import type { TipoSeguimiento } from '@/services/seguimiento';

export const NOMBRE_TIPO: Record<TipoSeguimiento, string> = {
  Adopcion: 'Adopción',
  Transito: 'Tránsito',
};
