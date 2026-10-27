/** Contrato común de los pasos del formulario de solicitud. */
import type { HogarSolicitante, PreguntaAplicable } from '@/services/solicitudes';

import type { Borrador, Errores, MascotaDeSolicitud } from './borrador';

export interface PasoProps {
  borrador: Borrador;
  errores: Errores;
  mascota: MascotaDeSolicitud;
  /** Cambia un campo del borrador y limpia el error que tuviera. */
  editar: <C extends keyof Borrador>(campo: C, valor: Borrador[C]) => void;
  /**
   * Lo que el usuario ya tenía declarado, si tenía. Solo lo usa `PasoHogar` (para mostrar
   * el resumen en vez del formulario vacío); el resto de los pasos lo ignora.
   */
  hogarPrecargado: HogarSolicitante | null;
  /** Si `PasoHogar` muestra el resumen o el formulario completo. Ídem, solo para ese paso. */
  editandoHogar: boolean;
  /** Pasa de resumen a formulario. Precarga ya está puesta desde `borradorInicial`. */
  onEditarHogar: () => void;
  /** Las preguntas propias del refugio para esta mascota. Solo las usa su paso y el resumen. */
  preguntas: PreguntaAplicable[];
}
