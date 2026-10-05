import { apiFetch, aQueryString } from "./api";
import type { DetalleCampanaAdmin, FiltrosCampanas, ListaCampanas } from "@/types/admin-campanas";

export const listarCampanas = (f: FiltrosCampanas, token: string): Promise<ListaCampanas> =>
  apiFetch(`/admin/campanas${aQueryString(f)}`, { token });

export const obtenerCampana = (id: number, token: string): Promise<DetalleCampanaAdmin> =>
  apiFetch(`/admin/campanas/${id}`, { token });
