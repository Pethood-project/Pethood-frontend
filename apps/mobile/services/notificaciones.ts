/**
 * Bandeja de notificaciones (spec 004). Contrato en `pethood-backend` bajo
 * `/api/v1/notificaciones`.
 */
import { LIMITES } from '@/shared/validation/limits';

import { del, get, post } from './api';

export interface NotificacionItem {
  id: number;
  tipo: string;
  mensaje: string;
  leido: boolean;
  /** A qué navegar al tocarla. `null` si no aplica. */
  entidadTipo: string | null;
  entidadId: number | null;
  fechaAlta: string;
}

export interface PaginaNotificaciones {
  notificaciones: NotificacionItem[];
  hayMas: boolean;
  proximoCursor: number | null;
}

/** GUI de la bandeja: la primera página con `cursor` en `null`, las siguientes con el `proximoCursor` de la anterior. */
export function listarNotificaciones(cursor: number | null): Promise<PaginaNotificaciones> {
  const params = new URLSearchParams({ limite: String(LIMITES.notificacion.pagina.porDefecto) });
  if (cursor !== null) params.set('cursor', String(cursor));

  return get(`/notificaciones?${params.toString()}`);
}

export function contarNoLeidas(): Promise<{ contador: number }> {
  return get('/notificaciones/no-leidas/contador');
}

export function marcarLeida(id: number): Promise<void> {
  return post(`/notificaciones/${id}/leida`, undefined);
}

export function marcarTodasLeidas(): Promise<void> {
  return post('/notificaciones/leidas', undefined);
}

export function eliminarNotificacion(id: number): Promise<void> {
  return del(`/notificaciones/${id}`);
}

export type PlataformaPush = 'ios' | 'android';

export function registrarDispositivo(expoPushToken: string, plataforma: PlataformaPush): Promise<void> {
  return post('/notificaciones/dispositivos', { expoPushToken, plataforma });
}

export function eliminarDispositivo(expoPushToken: string): Promise<void> {
  return del(`/notificaciones/dispositivos/${encodeURIComponent(expoPushToken)}`);
}
