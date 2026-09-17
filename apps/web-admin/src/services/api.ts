import type { ApiErrorBody } from "@/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  codigo: string;
  status: number;

  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.mensaje);
    this.codigo = body.codigo;
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
}

function esNoAutenticado(status: number, codigo?: string): boolean {
  return status === 401 && codigo === "NO_AUTENTICADO";
}

/** Cierra la sesión local y manda al login. En el browser no tira: si no, los
 *  `catch` de las tablas mostrarían el error un instante antes de navegar. */
export async function forzarLogoutSiNoAutenticado(status: number, codigo?: string): Promise<void> {
  if (!esNoAutenticado(status, codigo)) return;

  if (typeof window !== "undefined") {
    window.location.replace("/salir");
    await new Promise(() => undefined);
    return;
  }

  const { redirect } = await import("next/navigation");
  redirect("/salir");
}

// Cliente fetch tipado a /api/v1 — usar desde services/*, nunca desde componentes directamente.
export async function apiFetch<T>(ruta: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, token, headers, ...resto } = options;

  const res = await fetch(`${API_URL}${ruta}`, {
    ...resto,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorBody | null;
    const error = errorBody?.error ?? { codigo: "ERROR_DESCONOCIDO", mensaje: "Ocurrió un error inesperado." };
    await forzarLogoutSiNoAutenticado(res.status, error.codigo);
    throw new ApiError(res.status, error);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
