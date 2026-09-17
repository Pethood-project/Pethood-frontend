/**
 * Cliente HTTP contra la API. Centraliza la URL base, el token y el formato de error
 * `{ error: { codigo, mensaje } }` que devuelve el backend, para que las pantallas solo
 * tengan que mostrar el mensaje.
 *
 * Conviven dos estilos de llamada porque los módulos se escribieron en paralelo:
 * - `get` / `post` / `del` / `postFormData` / `patchFormData` — buscan el token guardado
 *   por su cuenta. Los usan mascotas, catálogos y publicaciones.
 * - `apiFetch` — recibe el token por parámetro. Lo usan auth, usuarios y perfil.
 *
 * Los dos comparten la resolución de URL, la traducción de errores y el envío multipart.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ApiErrorBody } from '@/types/api';

import { invalidarSesionPorToken, obtenerToken } from './sesion';

/** Error de la API ya traducido a algo mostrable al usuario. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly codigo: string,
    public readonly status: number,
  ) {
    super(message);
  }

  /** Alias de `message`: las pantallas de auth y perfil leen `err.mensaje`. */
  get mensaje(): string {
    return this.message;
  }
}

/**
 * Origen del backend, sin `/api/v1`.
 *
 * La variable se acepta con y sin el sufijo `/api/v1` porque durante un tiempo
 * convivieron las dos convenciones en los `.env` del equipo: normalizarla acá evita que
 * un `.env` viejo rompa la app en silencio.
 *
 * Si no está configurada, en un dispositivo real `localhost` apuntaría al teléfono y no
 * a la PC, así que se deduce la IP de la máquina que sirve Metro.
 */
function resolverOrigen(): string {
  const configurada = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configurada) {
    return configurada.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3000` : 'http://localhost:3000';
}

export const URL_BASE = resolverOrigen();

/** Raíz de los endpoints. Las rutas que reciben los helpers cuelgan de acá. */
export const API_URL = `${URL_BASE}/api/v1`;

/** Convierte una ruta relativa devuelta por la API en una URL absoluta. */
export function urlAbsoluta(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
  return `${URL_BASE}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

export interface ArchivoAdjunto {
  uri: string;
  nombre: string;
  tipo: string;
}

/**
 * Adjunta un archivo (foto, documento) a un `FormData` de forma multiplataforma.
 *
 * En nativo, React Native reconoce el objeto `{ uri, name, type }` puesto en un `FormData` y
 * lee el archivo local por su cuenta al armar el multipart. En web ese mecanismo no existe:
 * el `FormData` ahí es el estándar del DOM, que solo acepta `string` o `Blob`/`File`. Pasarle
 * ese objeto no tira error, pero tampoco sube nada — lo serializa como texto plano y el
 * archivo llega vacío al backend. Por eso en web hay que resolver la uri (`blob:` o `data:`
 * que devuelven los pickers de Expo) a un `Blob` real antes de adjuntarla.
 */
export async function adjuntarArchivo(
  formData: FormData,
  campo: string,
  archivo: ArchivoAdjunto,
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(archivo.uri)).blob();
    formData.append(campo, blob, archivo.nombre);
    return;
  }

  formData.append(campo, {
    uri: archivo.uri,
    name: archivo.nombre,
    type: archivo.tipo,
  } as unknown as Blob);
}

const MENSAJE_ERROR_GENERICO =
  'No pudimos completar la acción. Revisá tu conexión e intentalo de nuevo.';

/** Traduce el cuerpo de una respuesta fallida al `ApiError` que ven las pantallas. */
function aApiError(status: number, cuerpo: unknown): ApiError {
  const error = (cuerpo as ApiErrorBody | null)?.error;

  return new ApiError(
    error?.mensaje ?? MENSAJE_ERROR_GENERICO,
    error?.codigo ?? 'ERROR_DESCONOCIDO',
    status,
  );
}

function interpretarCuerpo(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    // El backend no devolvió JSON (ej. un 502 de un proxy).
    return null;
  }
}

async function rechazarRespuesta(status: number, cuerpo: unknown): Promise<never> {
  const error = aApiError(status, cuerpo);

  // Solo NO_AUTENTICADO: CREDENCIALES_INVALIDAS (login / contraseña actual) no cierra sesión.
  if (error.status === 401 && error.codigo === 'NO_AUTENTICADO') {
    await invalidarSesionPorToken();
  }

  throw error;
}

async function procesarRespuesta<T>(respuesta: Response): Promise<T> {
  if (respuesta.ok) {
    return respuesta.status === 204 ? (undefined as T) : ((await respuesta.json()) as T);
  }

  const cuerpo = await respuesta.json().catch(() => null);
  return rechazarRespuesta(respuesta.status, cuerpo);
}

async function cabeceras(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await obtenerToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export async function get<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    headers: await cabeceras(),
  });

  return procesarRespuesta<T>(respuesta);
}

export async function post<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: await cabeceras({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(cuerpo),
  });

  return procesarRespuesta<T>(respuesta);
}

export async function patch<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'PATCH',
    headers: await cabeceras({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(cuerpo),
  });

  return procesarRespuesta<T>(respuesta);
}

/** `delete` es palabra reservada, así que el helper del verbo DELETE se llama `del`. */
export async function del<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'DELETE',
    headers: await cabeceras(),
  });

  return procesarRespuesta<T>(respuesta);
}

/**
 * Envío multipart. Usa XMLHttpRequest y no fetch: el fetch global de Expo pasa los
 * archivos por base64 y corrompe la imagen. El XHR de React Native la sube directo
 * desde su uri.
 */
async function enviarFormData<T>(
  metodo: string,
  ruta: string,
  formData: FormData,
  tokenExplicito?: string,
): Promise<T> {
  const token = tokenExplicito ?? (await obtenerToken());

  return new Promise<T>((resolve, reject) => {
    const peticion = new XMLHttpRequest();
    peticion.open(metodo, `${API_URL}${ruta}`);

    // El Content-Type con su boundary lo arma el XHR: no setearlo a mano.
    if (token) peticion.setRequestHeader('Authorization', `Bearer ${token}`);

    peticion.onload = () => {
      const cuerpo = interpretarCuerpo(peticion.responseText);

      if (peticion.status >= 200 && peticion.status < 300) {
        resolve(cuerpo as T);
        return;
      }

      void rechazarRespuesta(peticion.status, cuerpo).catch(reject);
    };

    peticion.onerror = () =>
      reject(new ApiError(MENSAJE_ERROR_GENERICO, 'ERROR_DE_RED', peticion.status));

    peticion.send(formData);
  });
}

export function postFormData<T>(ruta: string, formData: FormData): Promise<T> {
  return enviarFormData<T>('POST', ruta, formData);
}

export function patchFormData<T>(ruta: string, formData: FormData): Promise<T> {
  return enviarFormData<T>('PATCH', ruta, formData);
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
}

function esFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

/**
 * Variante que recibe el token por parámetro, para las pantallas que ya lo tienen a mano
 * y no quieren volver a leerlo del almacenamiento seguro.
 */
export async function apiFetch<T>(ruta: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, token, headers, method = 'GET', ...resto } = options;

  // Los multipart van por XHR igual que `postFormData`, para no corromper las imágenes.
  if (esFormData(body)) {
    return enviarFormData<T>(method, ruta, body, token);
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...resto,
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return procesarRespuesta<T>(respuesta);
}
