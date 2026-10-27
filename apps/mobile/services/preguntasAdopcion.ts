/**
 * Las preguntas propias de un refugio para el formulario de solicitud. Las gestiona cualquier
 * miembro del refugio desde la vista de refugio; quien solicita las recibe ya filtradas en el
 * chequeo previo (`obtenerElegibilidad`).
 */
import { del, get, patch, post, put } from './api';
import type { TipoPregunta } from './solicitudes';

/** Una pregunta tal como la ve el refugio que la configura. */
export interface PreguntaAdopcion {
  id: number;
  texto: string;
  tipo: TipoPregunta;
  opciones: string[];
  obligatoria: boolean;
  orden: number;
  activa: boolean;
  /** `null` = aplica a todas las especies. */
  especie: { id: number; nombre: string } | null;
}

export interface DatosPregunta {
  texto: string;
  tipo: TipoPregunta;
  opciones: string[];
  obligatoria: boolean;
  /** `null` = todas las especies. */
  especieId: number | null;
}

interface ListaPreguntas {
  preguntas: PreguntaAdopcion[];
}

export async function listarPreguntas(): Promise<PreguntaAdopcion[]> {
  return (await get<ListaPreguntas>('/preguntas-adopcion')).preguntas;
}

export function crearPregunta(datos: DatosPregunta): Promise<PreguntaAdopcion> {
  return post('/preguntas-adopcion', datos);
}

export function actualizarPregunta(
  id: number,
  datos: Partial<DatosPregunta> & { activa?: boolean },
): Promise<PreguntaAdopcion> {
  return patch(`/preguntas-adopcion/${id}`, datos);
}

export async function eliminarPregunta(id: number): Promise<void> {
  await del(`/preguntas-adopcion/${id}`);
}

/** Ordena las que nombra, en ese orden. */
export async function reordenarPreguntas(ids: number[]): Promise<PreguntaAdopcion[]> {
  return (await put<ListaPreguntas>('/preguntas-adopcion/orden', { ids })).preguntas;
}
