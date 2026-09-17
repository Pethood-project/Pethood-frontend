/**
 * Concuerda en género gramatical un texto según el sexo de la mascota, para no mostrar
 * "castrado" en una hembra ni "esterilizada" en un macho.
 *
 * Mientras no se eligió el sexo (formulario de alta a medio completar) se muestra el
 * masculino, que es la forma neutra que ya usaba toda la app.
 */
import type { Genero } from '@/services/mascotas';

export function textoSegunGenero(
  genero: Genero | null | undefined,
  masculino: string,
  femenino: string,
): string {
  return genero === 'HEMBRA' ? femenino : masculino;
}
