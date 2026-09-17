import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, decodeSesion, tieneRol } from "@/lib/auth";

// Guard de routing por rol entre el panel de administrador y el de refugio.
// Redirige por UX; el backend es quien rechaza de verdad los endpoints sin permiso.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const esRutaAdmin = pathname.startsWith("/admin");
  const esRutaRefugio = pathname.startsWith("/refugio");

  const sesion = decodeSesion(request.cookies.get(AUTH_COOKIE)?.value);

  if ((esRutaAdmin || esRutaRefugio) && !sesion) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const respuesta = NextResponse.redirect(loginUrl);
    // Cookie presente pero JWT vencido o ilegible: se borra para no reabrir el panel.
    if (request.cookies.get(AUTH_COOKIE)) {
      respuesta.cookies.set(AUTH_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
    }
    return respuesta;
  }

  if (esRutaAdmin && sesion && !tieneRol(sesion, "ADMIN")) {
    return NextResponse.redirect(new URL("/refugio/dashboard", request.url));
  }

  if (esRutaRefugio && sesion && !tieneRol(sesion, "MIEMBRO_REFUGIO")) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/refugio/:path*"],
};
