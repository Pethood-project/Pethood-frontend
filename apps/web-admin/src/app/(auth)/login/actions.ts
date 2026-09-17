"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, decodeSesion, tieneRol, tokenExp } from "@/lib/auth";
import { ApiError } from "@/services/api";
import { login } from "@/services/auth";

export interface EstadoLogin {
  error?: string;
}

// Este panel es exclusivo para Administrador y Refugio (CLAUDE.md) — un Adoptante
// puede loguearse con las mismas credenciales pero no tiene lugar acá, así que se
// rechaza acá aunque el backend haya autenticado bien.
export async function loginAction(_estadoPrevio: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá email y contraseña para continuar." };
  }

  let respuesta;
  try {
    respuesta = await login({ email, password });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "No pudimos iniciar sesión. Intentá de nuevo." };
  }

  const sesion = decodeSesion(respuesta.token);
  const esAdmin = tieneRol(sesion, "ADMIN");
  const esRefugio = tieneRol(sesion, "MIEMBRO_REFUGIO");

  if (!esAdmin && !esRefugio) {
    return { error: "Este panel es exclusivo para administradores y refugios." };
  }

  const exp = tokenExp(respuesta.token);
  const maxAge = Math.max(exp - Math.floor(Date.now() / 1000), 0);

  (await cookies()).set(AUTH_COOKIE, respuesta.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  redirect(esAdmin ? "/admin/dashboard" : "/refugio/dashboard");
}
