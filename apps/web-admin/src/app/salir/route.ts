import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const ATRIBUTOS_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Borra la cookie de sesión y manda al login. Lo usan el cliente HTTP ante un 401
 *  NO_AUTENTICADO y los layouts cuando el JWT ya no se puede usar. */
export function GET(request: Request) {
  const respuesta = NextResponse.redirect(new URL("/login", request.url));
  respuesta.cookies.set(AUTH_COOKIE, "", { ...ATRIBUTOS_COOKIE, maxAge: 0 });
  return respuesta;
}
