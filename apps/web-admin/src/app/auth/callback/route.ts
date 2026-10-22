import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, OAUTH_NONCE_COOKIE, decodeSesion, opcionesCookieSesion, tieneRol } from "@/lib/auth";
import { canjearCodigoGoogle } from "@/services/auth";

/** Destino del login con Google: el backend redirige acá con `?code=` de un solo uso, que se
 *  canjea por el JWT y se guarda en la cookie httpOnly. Los permisos ya los validó el backend;
 *  el chequeo de rol es solo por UX. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nonce = (await cookies()).get(OAUTH_NONCE_COOKIE)?.value;

  const aLogin = (error: string) => {
    const respuesta = NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
    respuesta.cookies.delete({ name: OAUTH_NONCE_COOKIE, path: "/auth" });
    return respuesta;
  };

  if (!code || !nonce) return aLogin("google_error");

  let token: string;
  try {
    ({ token } = await canjearCodigoGoogle(code, nonce));
  } catch {
    return aLogin("google_error");
  }

  const sesion = decodeSesion(token);
  const esAdmin = tieneRol(sesion, "ADMIN");
  if (!esAdmin && !tieneRol(sesion, "MIEMBRO_REFUGIO")) return aLogin("sin_permisos_panel");

  const respuesta = NextResponse.redirect(new URL(esAdmin ? "/admin/dashboard" : "/refugio/dashboard", request.url));
  respuesta.cookies.set(AUTH_COOKIE, token, opcionesCookieSesion(token));
  respuesta.cookies.delete({ name: OAUTH_NONCE_COOKIE, path: "/auth" });
  return respuesta;
}
