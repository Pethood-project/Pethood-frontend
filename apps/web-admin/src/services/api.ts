import type { ApiErrorBody } from "@/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

/** Las rutas de archivos que devuelve la API (`/api/v1/archivos/...`) son relativas al origen. */
export function urlArchivo(ruta: string): string {
  if (/^https?:\/\//.test(ruta)) return ruta;
  return `${API_URL.replace(/\/api\/v1\/?$/, "")}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}

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

/** Navega a `destino` desde donde se esté. En el browser no tira: si no, los `catch` de las
 *  tablas mostrarían el error un instante antes de navegar. */
async function irA(destino: string): Promise<void> {
  if (typeof window !== "undefined") {
    window.location.replace(destino);
    await new Promise(() => undefined);
    return;
  }

  const { redirect } = await import("next/navigation");
  redirect(destino);
}

/** Cierra la sesión local y manda al login. */
export async function forzarLogoutSiNoAutenticado(status: number, codigo?: string): Promise<void> {
  if (esNoAutenticado(status, codigo)) await irA("/salir");
}

/** El refugio todavía no fue aprobado (o está suspendido): el panel no sirve, se muestra "en revisión". */
async function derivarSiRefugioNoVerificado(status: number, codigo?: string): Promise<void> {
  if (status === 403 && codigo === "REFUGIO_NO_VERIFICADO") await irA("/en-revision");
}

// Cliente fetch tipado a /api/v1 — usar desde services/*, nunca desde componentes directamente.
export async function apiFetch<T>(ruta: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, token, headers, ...resto } = options;

  const res = await fetch(`${API_URL}${ruta}`, {
    ...resto,
    headers: {
      // Con FormData (multipart) el navegador arma el Content-Type con su boundary.
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorBody | null;
    const error = errorBody?.error ?? { codigo: "ERROR_DESCONOCIDO", mensaje: "Ocurrió un error inesperado." };
    await forzarLogoutSiNoAutenticado(res.status, error.codigo);
    await derivarSiRefugioNoVerificado(res.status, error.codigo);
    throw new ApiError(res.status, error);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function aQueryString(filtros: object): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros as Record<string, string | number | boolean | undefined>)) {
    if (valor !== undefined && valor !== "") params.set(clave, String(valor));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
