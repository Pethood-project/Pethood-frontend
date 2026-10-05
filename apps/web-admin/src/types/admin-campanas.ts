// Contrato: GET /admin/campanas y /admin/campanas/:id (solo lectura).
import type { Lista } from "./admin-moderacion";

export interface CampanaAdmin {
  id: number;
  titulo: string;
  objetivo: string;
  fechaInicio: string;
  fechaFin: string;
  imagenUrl: string | null;
  estado: { id: number; nombre: string };
  refugio: { id: number; nombre: string };
  fechaAlta: string;
}

/** `montoDeclarado` NO es lo recaudado (regla 11): no usarlo para barras de progreso. */
export interface DetalleCampanaAdmin extends CampanaAdmin {
  descripcion: string | null;
  donaciones: { cantidad: number; montoDeclarado: string };
}

export interface FiltrosCampanas {
  page?: number;
  limit?: number;
  q?: string;
  estado?: string;
}

export type ListaCampanas = Lista<CampanaAdmin>;
