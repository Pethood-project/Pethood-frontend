/**
 * Sistema de Reputación (Módulo 10): alta de reseña, historial/promedio de una persona o un
 * refugio, y transacciones concretadas pendientes de reseñar.
 *
 * El backend deriva autor y receptor de la transacción: el cliente solo elige puntuación y
 * comentario. Contrato en `pethood-backend/src/modules/resenas/`.
 */
import { del, get, post } from './api';

/** Flujo de la transacción que habilitó la reseña. `null` en reseñas históricas sin solicitud. */
export type FlujoResena =
  | 'ADOPTANTE_A_REFUGIO'
  | 'ADOPTANTE_A_ADOPTANTE'
  | 'REFUGIO_A_ADOPTANTE'
  | 'REFUGIO_A_TRANSITO';

/** Quién recibe la reseña. */
export type TipoReceptor = 'REFUGIO' | 'PERSONA';

export interface AutorResena {
  id: number;
  nombre: string;
  apellido: string;
  imagenUrl: string | null;
}

export interface Resena {
  id: number;
  puntuacion: number;
  comentario: string | null;
  /** Instante ISO de alta. */
  fecha: string;
  autor: AutorResena;
  receptor: TipoReceptor;
  flujo: FlujoResena | null;
}

/** Cuántas reseñas hay de cada puntuación, de 5 a 1. */
export interface DistribucionEstrellas {
  puntuacion: number;
  cantidad: number;
}

export interface ResumenResenas {
  promedio: number | null;
  cantidad: number;
  distribucion: DistribucionEstrellas[];
  resenas: Resena[];
}

export interface ContraparteResena {
  tipo: TipoReceptor;
  id: number;
  nombre: string;
  imagenUrl: string | null;
}

/** Una transacción concretada que el usuario todavía no reseñó. */
export interface TransaccionElegible {
  solicitudId: number;
  tipoSolicitud: string;
  fecha: string;
  mascota: { id: number; nombre: string | null; imagenUrl: string | null };
  contraparte: ContraparteResena;
  flujo: FlujoResena;
}

export interface NuevaResena {
  solicitudId: number;
  puntuacion: number;
  comentario?: string;
}

export function obtenerResenasDeUsuario(usuarioId: number): Promise<ResumenResenas> {
  return get(`/resenas/usuario/${usuarioId}`);
}

export function obtenerResenasDeRefugio(refugioId: number): Promise<ResumenResenas> {
  return get(`/resenas/refugio/${refugioId}`);
}

/** Transacciones concretadas que el perfil activo todavía puede reseñar. */
export function listarTransaccionesElegibles(): Promise<TransaccionElegible[]> {
  return get('/resenas/elegibles');
}

export function crearResena(datos: NuevaResena): Promise<Resena> {
  return post('/resenas', {
    solicitudId: datos.solicitudId,
    puntuacion: datos.puntuacion,
    ...(datos.comentario?.trim() ? { comentario: datos.comentario.trim() } : {}),
  });
}

/** Baja lógica (HU-10.6). Solo administradores. */
export function darDeBajaResena(id: number): Promise<void> {
  return del(`/resenas/${id}`);
}

/**
 * Texto del flujo, para el chip de la reseña. En las reseñas históricas sin transacción
 * (`null`) se muestra como "Reseña".
 */
export function etiquetaFlujo(flujo: FlujoResena | null): string {
  switch (flujo) {
    case 'ADOPTANTE_A_REFUGIO':
      return 'Adoptante a refugio';
    case 'ADOPTANTE_A_ADOPTANTE':
      return 'Adoptante a adoptante';
    case 'REFUGIO_A_ADOPTANTE':
      return 'Refugio a adoptante';
    case 'REFUGIO_A_TRANSITO':
      return 'Refugio a tránsito';
    default:
      return 'Reseña';
  }
}
