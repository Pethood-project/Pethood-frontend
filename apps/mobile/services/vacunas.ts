/**
 * Vacunas de la mascota (spec 019 del backend). El plan de vacunación es fijo y depende de
 * la especie: el backend lo sirve por especie y es la fuente de verdad de qué vacunas
 * existen, sus nombres y para qué sirve cada una.
 *
 * Las vacunas que tiene una mascota no se cargan como texto: son registros de su historia
 * clínica marcados con el tipo de vacuna, y de ahí salen las medallas.
 */
import { get } from './api';

/**
 * Código estable de la vacuna (spec 029 del backend). Desde que el plan es un catálogo que el
 * admin edita, puede llegar uno nuevo que la app no conoce: por eso es `string` y no una unión.
 */
export type TipoVacuna = string;

/** Una opción del plan de vacunación de una especie. */
export interface VacunaCatalogo {
  tipo: TipoVacuna;
  /** Nombre corto, el de la medalla ("Vacuna Múltiple"). */
  nombre: string;
  /** Para qué sirve y a qué edad se aplica, tal como lo muestra el detalle de la medalla. */
  descripcion: string;
}

/** Vacuna que la mascota ya tiene: una medalla. */
export interface VacunaAplicada extends VacunaCatalogo {
  /** `AAAA-MM-DD` de la aplicación más reciente de esa vacuna. */
  fechaAplicacion: string;
}

/** Plan de la especie, en el orden del calendario. Vacío si la especie no tiene plan. */
export function listarVacunas(especieId: number): Promise<VacunaCatalogo[]> {
  return get(`/especies/${especieId}/vacunas`);
}
