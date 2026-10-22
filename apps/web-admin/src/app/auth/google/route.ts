import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { OAUTH_NONCE_COOKIE } from "@/lib/auth";
import { urlLoginGoogle } from "@/services/auth";

/** Arranca el login con Google: guarda un nonce en una cookie httpOnly y lo pasa al backend, así
 *  el código que vuelve en /auth/callback solo sirve en este navegador. */
export function GET() {
  const nonce = randomBytes(32).toString("base64url");
  const respuesta = NextResponse.redirect(urlLoginGoogle(nonce));
  respuesta.cookies.set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth",
    maxAge: 10 * 60,
  });
  return respuesta;
}
