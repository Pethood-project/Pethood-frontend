import { appendArchivoImagen, type ArchivoImagenLocal } from '@/lib/formDataImagen';
import { apiFetch } from '@/services/api';
import type { RegistroPayload, RespuestaAuth, RespuestaRecuperar } from '@/types/auth';

export function login(email: string, password: string): Promise<RespuestaAuth> {
  return apiFetch<RespuestaAuth>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function registro(
  payload: RegistroPayload,
  imagen?: ArchivoImagenLocal,
): Promise<RespuestaAuth> {
  const form = new FormData();
  form.append('nombre', payload.nombre);
  form.append('apellido', payload.apellido);
  form.append('email', payload.email);
  form.append('password', payload.password);
  form.append('fechaNacimiento', payload.fechaNacimiento);
  form.append('telefono', payload.telefono);

  if (imagen) {
    await appendArchivoImagen(form, 'imagen', imagen);
  }

  return apiFetch<RespuestaAuth>('/auth/registro', {
    method: 'POST',
    body: form,
  });
}

export function loginGoogle(idToken: string): Promise<RespuestaAuth> {
  return apiFetch<RespuestaAuth>('/auth/google', {
    method: 'POST',
    body: { idToken },
  });
}

export function logout(token: string): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    token,
  });
}

export function solicitarRecuperacion(email: string): Promise<RespuestaRecuperar> {
  return apiFetch<RespuestaRecuperar>('/auth/recuperar', {
    method: 'POST',
    body: { email },
  });
}

export function resetearPassword(
  email: string,
  codigo: string,
  password: string,
): Promise<void> {
  return apiFetch<void>('/auth/resetear', {
    method: 'POST',
    body: { email, codigo, password },
  });
}
