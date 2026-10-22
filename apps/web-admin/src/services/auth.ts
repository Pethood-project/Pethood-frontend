import { API_URL, apiFetch } from "./api";
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

// GET /api/v1/auth/google?destino=panel&nonce=… — arranca el OAuth de Google. El backend no crea
// cuentas en este modo y termina en /auth/callback?code=…, o en /login?error=<codigo>.
export function urlLoginGoogle(nonce: string): string {
  return `${API_URL}/auth/google?destino=panel&nonce=${encodeURIComponent(nonce)}`;
}

// POST /api/v1/auth/google/canje — cambia el código de un solo uso por el JWT. El nonce ata el
// código al navegador que arrancó el flujo.
export function canjearCodigoGoogle(code: string, nonce: string): Promise<{ token: string }> {
  return apiFetch("/auth/google/canje", { method: "POST", body: { code, nonce } });
}
