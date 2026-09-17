/**
 * Persistencia de la sesión: token JWT y datos del usuario logueado.
 *
 * Es el ÚNICO lugar que lee o escribe la sesión. Antes convivía con `lib/session.ts`, que
 * guardaba con otras claves: el cliente HTTP leía una y el login escribía la otra, así que
 * ninguna petición autenticada llevaba el token y el backend respondía 401.
 *
 * En nativo el token va en expo-secure-store (keychain / keystore), nunca en AsyncStorage
 * plano. En web (solo debug) SecureStore no existe: se cae a localStorage.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Usuario } from '@/types/auth';

const CLAVE_TOKEN = 'phd_token';
const CLAVE_USUARIO = 'phd_usuario';
const CLAVE_VISTA_REFUGIO = 'phd_vista_refugio';
const ES_WEB = Platform.OS === 'web';

async function leer(clave: string): Promise<string | null> {
  if (ES_WEB) return window.localStorage.getItem(clave);
  return SecureStore.getItemAsync(clave);
}

async function escribir(clave: string, valor: string): Promise<void> {
  if (ES_WEB) {
    window.localStorage.setItem(clave, valor);
    return;
  }
  await SecureStore.setItemAsync(clave, valor);
}

async function borrar(clave: string): Promise<void> {
  if (ES_WEB) {
    window.localStorage.removeItem(clave);
    return;
  }
  await SecureStore.deleteItemAsync(clave);
}

/** Quién pertenece a un refugio y, por lo tanto, puede administrarlo. */
export function esMiembroDeRefugio(usuario: Usuario | null): boolean {
  return Boolean(usuario?.roles.includes('MIEMBRO_REFUGIO'));
}

/**
 * Si quien pertenece a un refugio está viendo la app como refugio o como adoptante.
 *
 * Se guarda para que la elección sobreviva a cerrar la app: es un modo de trabajo, no algo
 * que haya que volver a elegir en cada arranque.
 */
export async function obtenerVistaRefugio(): Promise<boolean> {
  return (await leer(CLAVE_VISTA_REFUGIO)) === 'true';
}

export async function guardarVistaRefugio(activa: boolean): Promise<void> {
  await escribir(CLAVE_VISTA_REFUGIO, String(activa));
}

export async function obtenerToken(): Promise<string | null> {
  return leer(CLAVE_TOKEN);
}

export async function guardarToken(token: string): Promise<void> {
  await escribir(CLAVE_TOKEN, token);
}

export async function guardarUsuario(usuario: Usuario): Promise<void> {
  await escribir(CLAVE_USUARIO, JSON.stringify(usuario));
}

export async function obtenerUsuario(): Promise<Usuario | null> {
  const guardado = await leer(CLAVE_USUARIO);
  if (!guardado) return null;

  try {
    return JSON.parse(guardado) as Usuario;
  } catch {
    // Dato corrupto o de un formato viejo: se descarta y la app pide login de nuevo.
    return null;
  }
}

export async function guardarSesion(token: string, usuario: Usuario): Promise<void> {
  await guardarToken(token);
  await guardarUsuario(usuario);
}

export async function borrarSesion(): Promise<void> {
  await borrar(CLAVE_TOKEN);
  await borrar(CLAVE_USUARIO);
  // Si no, quien entra después en el mismo dispositivo arranca en la vista del anterior.
  await borrar(CLAVE_VISTA_REFUGIO);
}

type ListenerSesionInvalida = () => void;
const listenersSesionInvalida = new Set<ListenerSesionInvalida>();

/** El provider de sesión se anota acá para volver al login cuando el token deja de servir. */
export function suscribirSesionInvalida(listener: ListenerSesionInvalida): () => void {
  listenersSesionInvalida.add(listener);
  return () => {
    listenersSesionInvalida.delete(listener);
  };
}

/**
 * True si el JWT no se puede leer o ya pasó su `exp`. No verifica firma: eso lo hace
 * el backend. Sirve para no restaurar una sesión que el usuario ya no podría usar.
 */
export function tokenInvalidoOExpirado(token: string): boolean {
  const payload = decodificarPayloadJwt(token);
  if (!payload) return true;
  if (typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now();
}

function decodificarPayloadJwt(token: string): { exp?: number } | null {
  const segmento = token.split('.')[1];
  if (!segmento) return null;

  try {
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

/**
 * Borra la sesión local y avisa al provider para volver al login. No llama al backend:
 * si llegamos acá el token ya no sirve (inválido o vencido).
 */
export async function invalidarSesionPorToken(): Promise<void> {
  await borrarSesion();
  listenersSesionInvalida.forEach((listener) => listener());
}
