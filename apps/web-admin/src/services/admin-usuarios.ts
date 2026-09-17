import { apiFetch } from "./api";
import type {
  AltaRefugioBody,
  DetalleRefugio,
  FiltrosRefugios,
  FiltrosUsuarios,
  ListaRefugios,
  ListaUsuarios,
  RefugioAdmin,
  RolesBody,
  UsuarioAdmin,
} from "@/types/admin-usuarios";

function aQueryString(filtros: object): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros as Record<string, string | number | undefined>)) {
    if (valor !== undefined && valor !== "") params.set(clave, String(valor));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

// --- Usuarios ----------------------------------------------------------------------------

export function listarUsuarios(filtros: FiltrosUsuarios, token: string): Promise<ListaUsuarios> {
  return apiFetch<ListaUsuarios>(`/admin/usuarios${aQueryString(filtros)}`, { token });
}

export function verificarUsuario(id: number, token: string): Promise<{ usuario: Partial<UsuarioAdmin> }> {
  return apiFetch(`/admin/usuarios/${id}/verificar`, { method: "PATCH", token });
}

export function suspenderUsuario(
  id: number,
  motivo: string,
  token: string,
): Promise<{ usuario: Partial<UsuarioAdmin> }> {
  return apiFetch(`/admin/usuarios/${id}/suspender`, { method: "PATCH", body: { motivo }, token });
}

export function reactivarUsuario(id: number, token: string): Promise<{ usuario: Partial<UsuarioAdmin> }> {
  return apiFetch(`/admin/usuarios/${id}/reactivar`, { method: "PATCH", token });
}

export function bajaUsuario(id: number, motivo: string, token: string): Promise<{ usuario: Partial<UsuarioAdmin> }> {
  return apiFetch(`/admin/usuarios/${id}/baja`, { method: "PATCH", body: { motivo }, token });
}

export function gestionarRoles(
  id: number,
  body: RolesBody,
  token: string,
): Promise<{ roles: UsuarioAdmin["roles"] }> {
  return apiFetch(`/admin/usuarios/${id}/roles`, { method: "PATCH", body, token });
}

// --- Refugios ------------------------------------------------------------------------------

export function listarRefugios(filtros: FiltrosRefugios, token: string): Promise<ListaRefugios> {
  return apiFetch<ListaRefugios>(`/admin/refugios${aQueryString(filtros)}`, { token });
}

export function obtenerRefugio(id: number, token: string): Promise<DetalleRefugio> {
  return apiFetch(`/admin/refugios/${id}`, { token });
}

export function altaRefugio(body: AltaRefugioBody, token: string): Promise<{ refugio: RefugioAdmin }> {
  return apiFetch("/admin/refugios", { method: "POST", body, token });
}

export function verificarRefugio(id: number, token: string): Promise<{ refugio: Partial<RefugioAdmin> }> {
  return apiFetch(`/admin/refugios/${id}/verificar`, { method: "PATCH", token });
}

export function suspenderRefugio(
  id: number,
  motivo: string,
  token: string,
): Promise<{ refugio: Partial<RefugioAdmin> }> {
  return apiFetch(`/admin/refugios/${id}/suspender`, { method: "PATCH", body: { motivo }, token });
}

export function reactivarRefugio(id: number, token: string): Promise<{ refugio: Partial<RefugioAdmin> }> {
  return apiFetch(`/admin/refugios/${id}/reactivar`, { method: "PATCH", token });
}

export function bajaRefugio(id: number, motivo: string, token: string): Promise<{ refugio: Partial<RefugioAdmin> }> {
  return apiFetch(`/admin/refugios/${id}/baja`, { method: "PATCH", body: { motivo }, token });
}
