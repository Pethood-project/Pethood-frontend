import type { RolUsuario } from "@/types/auth";

// Nombre de la cookie donde se guarda el JWT emitido por POST /api/v1/auth/login (spec 001).
export const AUTH_COOKIE = "phd_token";

// Nonce del login con Google: ata el código del callback al navegador que arrancó el flujo.
export const OAUTH_NONCE_COOKIE = "phd_oauth_nonce";

export interface Sesion {
  id: number;
  roles: RolUsuario[];
}

interface PayloadJwt {
  usuarioId?: number;
  roles?: unknown;
  exp?: unknown;
}

// Base64url -> objeto. Puede lanzar si el payload es ilegible; los callers lo atrapan.
function leerPayload(payload: string): PayloadJwt {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(atob(padded)) as PayloadJwt;
}

// Decodifica el payload del JWT sin verificar firma — solo para UX (routing/nav condicional).
// La autorización real siempre la valida el backend (CLAUDE.md: "validar en el cliente es solo para UX").
// Si el token está malformado o ya pasó su `exp`, se trata como "sin sesión" para volver al login.
export function decodeSesion(token: string | undefined | null): Sesion | null {
  if (!token) return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const data = leerPayload(payload);
    if (!data.usuarioId || !Array.isArray(data.roles)) return null;
    if (typeof data.exp === "number" && data.exp * 1000 <= Date.now()) return null;
    return { id: data.usuarioId, roles: data.roles as RolUsuario[] };
  } catch {
    return null;
  }
}

export function tieneRol(sesion: Sesion | null, rol: RolUsuario): boolean {
  return sesion?.roles.includes(rol) ?? false;
}

/** Extrae el `exp` (seconds) del JWT. Devuelve 0 si no existe o es ilegible. */
export function tokenExp(token: string): number {
  const payload = token.split(".")[1];
  if (!payload) return 0;
  try {
    const data = leerPayload(payload);
    return typeof data.exp === "number" ? data.exp : 0;
  } catch {
    return 0;
  }
}

/** Atributos de la cookie de sesión: viven lo que le queda de vida al JWT. */
export function opcionesCookieSesion(token: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(tokenExp(token) - Math.floor(Date.now() / 1000), 0),
  };
}
