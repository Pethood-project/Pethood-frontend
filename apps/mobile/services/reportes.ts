/**
 * Reporte de moderación (spec 008, HU-3.1 a HU-3.3). Cualquier sesión puede reportar un
 * objeto de los tipos de `TipoReporte`; resolverlo es del admin en web-admin.
 */
import { post } from './api';

export type TipoReporte =
  | 'PUBLICACION'
  | 'USUARIO'
  | 'REFUGIO'
  | 'RESENA'
  | 'ANIMAL_PERDIDO'
  | 'CAMPANIA'
  | 'MENSAJE';

export interface ReporteCreado {
  id: number;
  tipo: TipoReporte;
  objetoId: number;
  motivo: string;
  resuelto: false;
  fechaAlta: string;
}

/** Códigos del POST que son un "no se puede ahora" y no una falla: van como advertencia. */
export const CODIGOS_REPORTE_ADVERTENCIA = ['REPORTE_DUPLICADO', 'LIMITE_REPORTES'];

export async function crearReporte(tipo: TipoReporte, objetoId: number, motivo: string) {
  // Un `NaN` (ej. `Number('abc')`) se serializa como `null`: el campo viajaría vacío.
  if (!Number.isInteger(objetoId) || objetoId <= 0) {
    throw new Error('No pudimos identificar qué querés reportar. Intentalo de nuevo.');
  }

  const motivoLimpio = motivo.trim();
  if (!motivoLimpio) throw new Error('Este campo es obligatorio. Completalo para poder continuar.');

  return post<ReporteCreado>('/reportes', { tipo, objetoId, motivo: motivoLimpio });
}
