/**
 * Perfil del refugio del usuario. Las dos rutas son solo de la vista de refugio (el
 * backend responde `403 AMBITO_NO_PERMITIDO` desde la personal): la cabecera `X-Ambito` la
 * pone `apiFetch`.
 */
import { appendArchivoImagen, type ArchivoImagenLocal } from '@/lib/formDataImagen';
import { apiFetch } from '@/services/api';
import type { UbicacionPreview } from '@/types/auth';
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
  form.append('provincia', payload.provincia);
  form.append('localidad', payload.localidad);
  form.append('calleAltura', payload.calleAltura);
  form.append('telefono', payload.telefono);
  form.append('email', payload.email);
  form.append('descripcion', payload.descripcion);
  form.append('ubicacionVerificada', payload.ubicacionVerificada ? 'true' : 'false');

  if (imagen) {
    await appendArchivoImagen(form, 'imagen', imagen);
  }

  return apiFetch<RespuestaPerfilRefugio>('/refugio/perfil', {
    method: 'PATCH',
    token,
    body: form,
  });
}

/**
 * Corrige a mano el link de Google Maps del refugio. El backend recalcula latitud/longitud a
 * partir del link nuevo (lápiz de "Ubicación" en Mi Refugio).
 */
export function actualizarUbicacionRefugio(
  token: string,
  mapaUrl: string,
): Promise<RespuestaPerfilRefugio> {
  return apiFetch<RespuestaPerfilRefugio>('/refugio/perfil/ubicacion', {
    method: 'PATCH',
    token,
    body: { mapaUrl },
  });
}

/**
 * Geocodifica la dirección del refugio sin guardarla, para mostrar el link de Maps y que el
 * miembro lo verifique antes de guardar (Datos del refugio).
 */
export function previewUbicacionRefugio(
  token: string,
  direccion: { provincia: string; localidad: string; calleAltura: string },
): Promise<{ ubicacion: UbicacionPreview }> {
  return apiFetch<{ ubicacion: UbicacionPreview }>('/refugio/perfil/ubicacion/preview', {
    method: 'POST',
    token,
    body: direccion,
  });
}
