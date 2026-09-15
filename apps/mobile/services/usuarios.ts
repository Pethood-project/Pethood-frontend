import { appendArchivoImagen, type ArchivoImagenLocal } from '@/lib/formDataImagen';
import { apiFetch } from '@/services/api';
import type { ActualizarPerfilPayload, RespuestaPerfil } from '@/types/auth';

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
  form.append('ubicacion', payload.ubicacion);

  if (imagen) {
    await appendArchivoImagen(form, 'imagen', imagen);
  }

  return apiFetch<RespuestaPerfil>('/usuarios/me', {
    method: 'PATCH',
    token,
    body: form,
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
