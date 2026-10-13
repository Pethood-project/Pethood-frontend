/** Catálogos que alimentan los selectores de los formularios. */
import { get } from './api';

export interface OpcionCatalogo {
  id: number;
  nombre: string;
}

export interface EstadoMascota extends OpcionCatalogo {
  /** Si la mascota puede nacer con este estado. */
  seleccionableEnAlta: boolean;
  /** Si con este estado se puede ofrecer la mascota en adopción. */
  habilitaPublicacion: boolean;
}

export function listarEspecies(): Promise<OpcionCatalogo[]> {
  return get('/especies');
}

export function listarRazas(especieId: number): Promise<OpcionCatalogo[]> {
  return get(`/especies/${especieId}/razas`);
}

export function listarEstadosMascota(): Promise<EstadoMascota[]> {
  return get('/estados-mascota');
}

/** Estados del aviso (Activa, Pausada, Finalizada), para filtrar "Mis publicaciones". */
export function listarEstadosPublicacion(): Promise<OpcionCatalogo[]> {
  return get('/estados-publicacion');
}

/** Filtro por estado de «Mis Campañas» (spec 026). */
export function listarEstadosCampania(): Promise<OpcionCatalogo[]> {
  return get('/estados-campania');
}

export interface EstadoAnimalPerdido extends OpcionCatalogo {
  /** Si un aviso nuevo puede nacer con este estado (Perdido y Encontrado sí, Resuelto no). */
  seleccionableEnAlta: boolean;
}

/** Estados del aviso de mascota perdida: el filtro del portal y el selector del alta. */
export function listarEstadosAnimalPerdido(): Promise<EstadoAnimalPerdido[]> {
  return get('/estados-animal-perdido');
}
