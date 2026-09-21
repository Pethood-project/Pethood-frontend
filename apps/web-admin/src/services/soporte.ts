import { apiFetch } from "./api";
import type {
  Categoria,
  CategoriaBody,
  CategoriaPublica,
  Consulta,
  ConsultaBody,
  Faq,
  FaqBody,
} from "@/types/soporte";

// --- Público (sin token) -------------------------------------------------------------------

export function listarFaqsPublicas(): Promise<CategoriaPublica[]> {
  return apiFetch("/faqs");
}

export function enviarConsulta(body: ConsultaBody): Promise<{ mensaje: string }> {
  return apiFetch("/soporte/consultas", { method: "POST", body });
}

// --- Admin: consultas ----------------------------------------------------------------------

export function listarConsultas(resuelta: boolean | undefined, token: string): Promise<Consulta[]> {
  const query = resuelta === undefined ? "" : `?resuelta=${resuelta}`;
  return apiFetch(`/admin/soporte/consultas${query}`, { token });
}

export function resolverConsulta(id: number, token: string): Promise<Consulta> {
  return apiFetch(`/admin/soporte/consultas/${id}/resolver`, { method: "PATCH", token });
}

export function bajaConsulta(id: number, token: string): Promise<void> {
  return apiFetch(`/admin/soporte/consultas/${id}`, { method: "DELETE", token });
}

// --- Admin: categorías y FAQs --------------------------------------------------------------

export function listarCategorias(token: string): Promise<Categoria[]> {
  return apiFetch("/admin/faq-categorias", { token });
}

export function crearCategoria(body: CategoriaBody, token: string): Promise<Categoria> {
  return apiFetch("/admin/faq-categorias", { method: "POST", body, token });
}

export function editarCategoria(id: number, body: Partial<CategoriaBody>, token: string): Promise<Categoria> {
  return apiFetch(`/admin/faq-categorias/${id}`, { method: "PATCH", body, token });
}

export function bajaCategoria(id: number, token: string): Promise<void> {
  return apiFetch(`/admin/faq-categorias/${id}`, { method: "DELETE", token });
}

export function crearFaq(body: FaqBody, token: string): Promise<Faq> {
  return apiFetch("/admin/faqs", { method: "POST", body, token });
}

export function editarFaq(id: number, body: Partial<FaqBody>, token: string): Promise<Faq> {
  return apiFetch(`/admin/faqs/${id}`, { method: "PATCH", body, token });
}

export function bajaFaq(id: number, token: string): Promise<void> {
  return apiFetch(`/admin/faqs/${id}`, { method: "DELETE", token });
}
