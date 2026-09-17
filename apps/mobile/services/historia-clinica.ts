/**
 * HU-8.1/8.2/8.3/8.4 Historia clínica. Los contratos salen de
 * `pethood-backend/docs/specs/005-historia-clinica.md`.
 *
 * "Modificar" nunca es un PUT/UPDATE de verdad: el backend da de baja el registro viejo y
 * crea uno nuevo con los datos fusionados, así que `editarHistoriaClinica` devuelve un
 * registro con un `id` distinto al que se editó. "Eliminar" (HU-8.4) sí es una baja lógica
 * simple, sin alta de reemplazo.
 */
import { adjuntarArchivo, del, get, patchFormData, postFormData } from './api';

export interface HistoriaClinica {
  id: number;
  fechaVisita: string;
  fechaProxima: string | null;
  requiereRevision: boolean;
  vacunacion: boolean;
  titulo: string;
  descripcion: string;
  documentoUrl: string | null;
  mascotaId: number;
  usuarioAlta: number;
  fechaAlta: string;
}

export interface DocumentoElegido {
  uri: string;
  nombre: string;
  tipo: string;
}

export interface DatosNuevaHistoriaClinica {
  fechaVisita: string;
  fechaProxima?: string;
  requiereRevision: boolean;
  vacunacion: boolean;
  titulo: string;
  descripcion: string;
  documento?: DocumentoElegido;
}

/** Todos opcionales salvo lo que el usuario efectivamente cambió; `vacunacion` no se manda: no es editable. */
export interface CambiosHistoriaClinica {
  fechaVisita?: string;
  fechaProxima?: string;
  requiereRevision?: boolean;
  titulo?: string;
  descripcion?: string;
  documento?: DocumentoElegido;
}

async function formDataDesde(
  datos: DatosNuevaHistoriaClinica | CambiosHistoriaClinica,
): Promise<FormData> {
  const formData = new FormData();

  if (datos.fechaVisita !== undefined) formData.append('fechaVisita', datos.fechaVisita);
  if (datos.fechaProxima !== undefined) formData.append('fechaProxima', datos.fechaProxima);
  if (datos.requiereRevision !== undefined) {
    formData.append('requiereRevision', String(datos.requiereRevision));
  }
  if (datos.titulo !== undefined) formData.append('titulo', datos.titulo);
  if (datos.descripcion !== undefined) formData.append('descripcion', datos.descripcion);

  if (datos.documento) {
    await adjuntarArchivo(formData, 'documento', datos.documento);
  }

  return formData;
}

export async function crearHistoriaClinica(
  mascotaId: number,
  datos: DatosNuevaHistoriaClinica,
): Promise<HistoriaClinica> {
  const formData = await formDataDesde(datos);
  formData.append('vacunacion', String(datos.vacunacion));

  return postFormData(`/mascotas/${mascotaId}/historias-clinicas`, formData);
}

export function listarHistorial(mascotaId: number): Promise<HistoriaClinica[]> {
  return get(`/mascotas/${mascotaId}/historias-clinicas`);
}

export function obtenerHistoriaClinica(id: number): Promise<HistoriaClinica> {
  return get(`/historias-clinicas/${id}`);
}

export async function editarHistoriaClinica(
  id: number,
  cambios: CambiosHistoriaClinica,
): Promise<HistoriaClinica> {
  return patchFormData(`/historias-clinicas/${id}`, await formDataDesde(cambios));
}

/** HU-8.4: baja lógica simple, sin alta de reemplazo. */
export function eliminarHistoriaClinica(id: number): Promise<{ id: number }> {
  return del(`/historias-clinicas/${id}`);
}
