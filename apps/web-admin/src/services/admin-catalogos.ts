import { apiFetch, aQueryString } from "./api";
import type { BodyCatalogo, Catalogo, FiltrosCatalogo, ItemCatalogo, ListaCatalogo } from "@/types/admin-catalogos";

const base = (c: Catalogo) => `/admin/catalogos/${c}`;

export function listarCatalogo(c: Catalogo, filtros: FiltrosCatalogo, token: string): Promise<ListaCatalogo> {
  return apiFetch(`${base(c)}${aQueryString(filtros)}`, { token });
}

export function crearItemCatalogo(c: Catalogo, body: BodyCatalogo, token: string): Promise<ItemCatalogo> {
  return apiFetch(base(c), { method: "POST", body, token });
}

export function editarItemCatalogo(
  c: Catalogo,
  id: number | string,
  body: BodyCatalogo,
  token: string,
): Promise<ItemCatalogo> {
  return apiFetch(`${base(c)}/${id}`, { method: "PUT", body, token });
}

export function bajaItemCatalogo(c: Catalogo, id: number | string, token: string): Promise<ItemCatalogo> {
  return apiFetch(`${base(c)}/${id}/baja`, { method: "PATCH", token });
}

export function reactivarItemCatalogo(c: Catalogo, id: number | string, token: string): Promise<ItemCatalogo> {
  return apiFetch(`${base(c)}/${id}/reactivar`, { method: "PATCH", token });
}
