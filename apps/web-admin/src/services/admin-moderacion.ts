import { apiFetch, aQueryString } from "./api";
import type {
  AccionPublicacion,
  DetalleMascotaAdmin,
  DetallePublicacionAdmin,
  DetalleSolicitudAdmin,
  FiltrosModeracion,
  Lista,
  MascotaAdmin,
  PublicacionAdmin,
  SolicitudAdmin,
} from "@/types/admin-moderacion";

export const listarPublicaciones = (f: FiltrosModeracion, token: string): Promise<Lista<PublicacionAdmin>> =>
  apiFetch(`/admin/publicaciones${aQueryString(f)}`, { token });

export const cambiarEstadoPublicacion = (id: number, accion: AccionPublicacion, motivo: string, token: string) =>
  apiFetch(`/admin/publicaciones/${id}/estado`, { method: "PATCH", body: { accion, motivo }, token });

export const bajaPublicacion = (id: number, motivo: string, token: string) =>
  apiFetch(`/admin/publicaciones/${id}/baja`, { method: "PATCH", body: { motivo }, token });

export const reactivarPublicacion = (id: number, token: string) =>
  apiFetch(`/admin/publicaciones/${id}/reactivar`, { method: "PATCH", token });

export const listarMascotas = (f: FiltrosModeracion, token: string): Promise<Lista<MascotaAdmin>> =>
  apiFetch(`/admin/mascotas${aQueryString(f)}`, { token });

export const bajaMascota = (id: number, motivo: string, token: string) =>
  apiFetch(`/admin/mascotas/${id}/baja`, { method: "PATCH", body: { motivo }, token });

export const reactivarMascota = (id: number, motivo: string, token: string) =>
  apiFetch(`/admin/mascotas/${id}/reactivar`, { method: "PATCH", body: { motivo }, token });

export const listarSolicitudes = (f: FiltrosModeracion, token: string): Promise<Lista<SolicitudAdmin>> =>
  apiFetch(`/admin/solicitudes${aQueryString(f)}`, { token });

export const obtenerPublicacion = (id: number, token: string): Promise<DetallePublicacionAdmin> =>
  apiFetch(`/admin/publicaciones/${id}`, { token });

export const obtenerMascota = (id: number, token: string): Promise<DetalleMascotaAdmin> =>
  apiFetch(`/admin/mascotas/${id}`, { token });

export const obtenerSolicitud = (id: number, token: string): Promise<DetalleSolicitudAdmin> =>
  apiFetch(`/admin/solicitudes/${id}`, { token });
