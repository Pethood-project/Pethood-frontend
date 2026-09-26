/**
 * Perfil del refugio del usuario. Las dos rutas son solo de la vista de refugio (el
 * backend responde `403 AMBITO_NO_PERMITIDO` desde la personal): la cabecera `X-Ambito` la
 * pone `apiFetch`.
 */
import { appendArchivoImagen, type ArchivoImagenLocal } from '@/lib/formDataImagen';
import { apiFetch } from '@/services/api';
import type { ActualizarPerfilRefugioPayload, RespuestaPerfilRefugio } from '@/types/refugio';

export function obtenerPerfilRefugio(token: string): Promise<RespuestaPerfilRefugio> {
  return apiFetch<RespuestaPerfilRefugio>('/refugio/perfil', {
    method: 'GET',
    token,
  });
}

export async function actualizarPerfilRefugio(
  token: string,
  payload: ActualizarPerfilRefugioPayload,
  imagen?: ArchivoImagenLocal,
): Promise<RespuestaPerfilRefugio> {
  const form = new FormData();
  form.append('nombre', payload.nombre);
  form.append('direccion', payload.direccion);
  form.append('telefono', payload.telefono);
  form.append('email', payload.email);
  form.append('descripcion', payload.descripcion);

  if (imagen) {
    await appendArchivoImagen(form, 'imagen', imagen);
  }

  return apiFetch<RespuestaPerfilRefugio>('/refugio/perfil', {
    method: 'PATCH',
    token,
    body: form,
  });
}
