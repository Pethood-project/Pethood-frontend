import { apiFetch, aQueryString } from "./api";
import type { DetalleReporte, FiltrosReportes, ListaReportes } from "@/types/admin-reportes";

export const listarReportes = (f: FiltrosReportes, token: string): Promise<ListaReportes> =>
  apiFetch(`/admin/reportes${aQueryString(f)}`, { token });

export const obtenerReporte = (id: number, token: string): Promise<DetalleReporte> =>
  apiFetch(`/admin/reportes/${id}`, { token });

export const resolverReporte = (id: number, respuesta: string, token: string): Promise<DetalleReporte> =>
  apiFetch(`/admin/reportes/${id}/resolver`, { method: "PATCH", body: { respuesta }, token });

// Acciones sobre el objeto reportado. Resolver un reporte NO las dispara (spec 008 §6.8):
// el admin decide cuál aplicar, y cada una vive en su propio endpoint.
export const bajaAvisoPerdido = (id: number, motivo: string, token: string): Promise<void> =>
  apiFetch(`/admin/animales-perdidos/${id}/baja`, { method: "PATCH", body: { motivo }, token });

/** Baja lógica de una reseña (HU-10.6, spec 022). Sin motivo: el endpoint no lo pide. */
export const bajaResena = (id: number, token: string): Promise<void> =>
  apiFetch(`/resenas/${id}`, { method: "DELETE", token });
