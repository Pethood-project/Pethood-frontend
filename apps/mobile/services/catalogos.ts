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
