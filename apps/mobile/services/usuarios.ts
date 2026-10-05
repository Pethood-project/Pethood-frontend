import { appendArchivoImagen, type ArchivoImagenLocal } from '@/lib/formDataImagen';
import { apiFetch } from '@/services/api';
import type {
  ActualizarPerfilPayload,
  RespuestaPerfil,
  UbicacionPreview,
} from '@/types/auth';

export function obtenerPerfil(token: string): Promise<RespuestaPerfil> {
  return apiFetch<RespuestaPerfil>('/usuarios/me', {
    method: 'GET',
    token,
  });
}

export async function actualizarPerfil(
  token: string,
  payload: ActualizarPerfilPayload,
  imagen?: ArchivoImagenLocal,
): Promise<RespuestaPerfil> {
  const form = new FormData();
  form.append('nombre', payload.nombre);
  form.append('apellido', payload.apellido);
  form.append('email', payload.email);
  form.append('telefono', payload.telefono);
  form.append('provincia', payload.provincia);
  form.append('localidad', payload.localidad);
  form.append('calleAltura', payload.calleAltura);
  form.append('ubicacionVerificada', payload.ubicacionVerificada ? 'true' : 'false');

  if (imagen) {
    await appendArchivoImagen(form, 'imagen', imagen);
  }

  return apiFetch<RespuestaPerfil>('/usuarios/me', {
    method: 'PATCH',
    token,
    body: form,
  });
}

/**
 * Corrige a mano el link de Google Maps del perfil. El backend recalcula latitud/longitud a
 * partir del link nuevo (lápiz de "Ubicación" en Mi Perfil).
 */
export function actualizarUbicacion(token: string, mapaUrl: string): Promise<RespuestaPerfil> {
  return apiFetch<RespuestaPerfil>('/usuarios/me/ubicacion', {
    method: 'PATCH',
    token,
    body: { mapaUrl },
  });
}

/**
 * Geocodifica la dirección sin guardarla, para mostrar el link de Maps y que el usuario lo
 * verifique antes de guardar (Datos personales).
 */
export function previewUbicacion(
  token: string,
  direccion: { provincia: string; localidad: string; calleAltura: string },
): Promise<{ ubicacion: UbicacionPreview }> {
  return apiFetch<{ ubicacion: UbicacionPreview }>('/usuarios/me/ubicacion/preview', {
    method: 'POST',
    token,
    body: direccion,
  });
}

export function cambiarPassword(
  token: string,
  passwordNueva: string,
  passwordActual?: string,
): Promise<void> {
  return apiFetch<void>('/usuarios/me/password', {
    method: 'PATCH',
    token,
    body: {
      passwordNueva,
      ...(passwordActual ? { passwordActual } : {}),
    },
  });
}

export function darDeBajaCuenta(token: string): Promise<void> {
  return apiFetch<void>('/usuarios/me', {
    method: 'DELETE',
    token,
  });
}
