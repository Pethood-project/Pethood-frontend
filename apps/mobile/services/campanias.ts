/**
 * Campañas de donación (spec 026 del backend, HU-12.1 a HU-12.7). Contrato completo en
 * `pethood-backend/docs/api-campanias.md`.
 *
 * El perfil activo viaja solo en la cabecera `X-Ambito` (`api.ts`): el portal y donar son del
 * perfil personal, lo de `/refugio/...` del perfil de refugio.
 */
import type { MotivoRechazo, OrigenDonacion } from '@/lib/campanias';
import { aFechaISO } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';

import { adjuntarArchivo, get, patch, post, postFormData } from './api';

export interface Campania {
  id: number;
  titulo: string;
  descripcion: string;
  /** Ruta relativa o URL absoluta: siempre pasa por `urlAbsoluta`. */
  imagenUrl: string | null;
  objetivo: number;
  /** Sólo lo que el refugio confirmó. */
  recaudado: number;
  /** 0 a 100, para la barra. */
  porcentaje: number;
  donantes: number;
  /** `AAAA-MM-DD`. */
  fechaInicio: string;
  fechaFin: string;
  estado: { id: number; nombre: string };
  alias: string | null;
  cbu: string | null;
  refugio: { id: number; nombre: string; imagenUrl: string | null };
  /** El refugio tiene Mercado Pago vinculado: la donación se confirma sola (spec 027). */
  confirmacionAutomatica: boolean;
}

export interface CampaniaRefugio extends Campania {
  /** Donaciones esperando revisión. */
  pendientes: number;
}

export interface PaginaCampanias<T extends Campania> {
  campanias: T[];
  hayMas: boolean;
  proximoCursor: number | null;
}

export type EstadoDonacionFiltro = 'Pendiente' | 'Realizada' | 'Cancelada';

export interface Donacion {
  id: number;
  monto: number;
  estado: { id: number; nombre: string };
  motivoRechazo: MotivoRechazo | null;
  /** Desde dónde dijo que transfirió; `null` en donaciones anteriores al campo (spec 027). */
  origen: OrigenDonacion | null;
  /** La confirmó el sistema al encontrar la transferencia en Mercado Pago (spec 027). */
  confirmadaPorMercadoPago: boolean;
  /** ISO 8601. */
  fechaAlta: string;
  donante: { id: number; nombre: string; apellido: string; imagenUrl: string | null };
}

export interface PaginaDonaciones {
  donaciones: Donacion[];
  hayMas: boolean;
  proximoCursor: number | null;
}

/** Filtros de «Mis Campañas». La fecha es sobre el INICIO de la campaña; «hasta» sólo con «desde». */
export interface FiltrosMisCampanias {
  estados: number[];
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export const SIN_FILTROS_CAMPANIAS: FiltrosMisCampanias = { estados: [] };

function queryPagina(limite: number, cursor: number | null): URLSearchParams {
  const params = new URLSearchParams({ limite: String(limite) });
  if (cursor !== null) params.set('cursor', String(cursor));
  return params;
}

/** GUI-13. Portal de campañas activas. */
export function listarCampanias(cursor: number | null): Promise<PaginaCampanias<Campania>> {
  return get(`/campanias?${queryPagina(LIMITES.campania.pagina.porDefecto, cursor).toString()}`);
}

export function obtenerCampania(id: number): Promise<Campania> {
  return get(`/campanias/${id}`);
}

/**
 * «Terminar donación». `monto` va tal cual lo escribió el usuario (coma o punto): el backend
 * lo normaliza. La donación queda Pendiente hasta que el refugio la confirma.
 */
export function donar(
  campaniaId: number,
  monto: string,
  origen: OrigenDonacion,
): Promise<Donacion> {
  return post(`/campanias/${campaniaId}/donaciones`, { monto: monto.trim(), origen });
}

/** GUI-36. «Mis Campañas» del refugio, con los mismos filtros en cada página. */
export function listarMisCampanias(
  filtros: FiltrosMisCampanias,
  cursor: number | null,
): Promise<PaginaCampanias<CampaniaRefugio>> {
  const params = queryPagina(LIMITES.campania.pagina.porDefecto, cursor);

  if (filtros.estados.length > 0) params.set('estados', filtros.estados.join(','));
  if (filtros.fechaDesde) params.set('fechaDesde', aFechaISO(filtros.fechaDesde));
  if (filtros.fechaDesde && filtros.fechaHasta) {
    params.set('fechaHasta', aFechaISO(filtros.fechaHasta));
  }

  return get(`/refugio/campanias?${params.toString()}`);
}

export interface DatosNuevaCampania {
  titulo: string;
  descripcion: string;
  /** Tal cual se escribió: sólo dígitos. */
  objetivo: string;
  fechaInicio: Date;
  fechaFin: Date;
  alias: string;
  cbu: string;
  imagen: { uri: string; nombre: string; tipo: string };
}

/** GUI-37. Alta (multipart, la imagen en `imagen`). */
export async function crearCampania(datos: DatosNuevaCampania): Promise<CampaniaRefugio> {
  const formData = new FormData();

  formData.append('titulo', datos.titulo);
  formData.append('descripcion', datos.descripcion);
  formData.append('objetivo', datos.objetivo);
  formData.append('fechaInicio', aFechaISO(datos.fechaInicio));
  formData.append('fechaFin', aFechaISO(datos.fechaFin));
  formData.append('alias', datos.alias);
  formData.append('cbu', datos.cbu);
  await adjuntarArchivo(formData, 'imagen', datos.imagen);

  return postFormData('/refugio/campanias', formData);
}

/** HU-12.6 (finalizar) y HU-12.5 (cancelar). */
export function cambiarEstadoCampania(
  id: number,
  estado: 'Finalizada' | 'Cancelada',
): Promise<CampaniaRefugio> {
  return patch(`/refugio/campanias/${id}/estado`, { estado });
}

/** Bandeja de revisión. `estado` en `null` trae todas. */
export function listarDonaciones(
  campaniaId: number,
  estado: EstadoDonacionFiltro | null,
  cursor: number | null,
): Promise<PaginaDonaciones> {
  const params = queryPagina(LIMITES.donacion.pagina.porDefecto, cursor);
  if (estado) params.set('estado', estado);

  return get(`/refugio/campanias/${campaniaId}/donaciones?${params.toString()}`);
}

export type ResolucionDonacion =
  { estado: 'Realizada' } | { estado: 'Cancelada'; motivo: MotivoRechazo };

/** HU-12.3: aplicar (suma al progreso) o rechazar con motivo. */
export function resolverDonacion(id: number, resolucion: ResolucionDonacion): Promise<Donacion> {
  return patch(`/refugio/donaciones/${id}/estado`, resolucion);
}
