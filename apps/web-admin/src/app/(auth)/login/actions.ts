"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE, decodeSesion, opcionesCookieSesion, tieneRol } from "@/lib/auth";
import { ApiError } from "@/services/api";
import { login } from "@/services/auth";

export interface EstadoLogin {
  error?: string;
}

// Este panel es exclusivo para Administrador y Refugio (CLAUDE.md) — un Adoptante
// puede loguearse con las mismas credenciales pero no tiene lugar acá, así que se
// rechaza acá aunque el backend haya autenticado bien.
export async function loginAction(_estadoPrevio: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const campo = (nombre: string) => {
    const valor = formData.get(nombre);
    return typeof valor === "string" ? valor : "";
  };
  const email = campo("email").trim();
  const password = campo("password");

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

  // Refugio todavía no Activo (pendiente, suspendido o de baja): no se abre el panel ni se guarda
  // la sesión; se explica por qué. El backend igual lo rechaza con 403 REFUGIO_NO_VERIFICADO.
  if (!esAdmin && respuesta.usuario.refugio && respuesta.usuario.refugio.estado !== "Activo") {
    redirect("/en-revision");
  }

  (await cookies()).set(AUTH_COOKIE, respuesta.token, opcionesCookieSesion(respuesta.token));

  redirect(esAdmin ? "/admin/dashboard" : "/refugio/dashboard");
}
