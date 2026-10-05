import { apiFetch } from "./api";
import type { RespuestaLogin } from "@/types/auth";

export interface LoginBody {
  email: string;
  password: string;
}

// POST /api/v1/auth/login (spec 001) — único endpoint de login, compartido con mobile.
export function login(body: LoginBody): Promise<RespuestaLogin> {
  return apiFetch<RespuestaLogin>("/auth/login", { method: "POST", body });
}

// POST /api/v1/auth/registro-refugio — público, multipart. No devuelve token: se entra con el login.
export function registrarRefugio(datos: FormData): Promise<{ mensaje: string; refugio: { id: number; nombre: string; estado: string } }> {
  return apiFetch("/auth/registro-refugio", { method: "POST", body: datos });
}
