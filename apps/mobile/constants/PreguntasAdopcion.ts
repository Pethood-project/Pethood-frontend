/** Rótulos de las preguntas propias del refugio, en un solo lugar para el listado y el formulario. */
import type { TipoPregunta } from '@/services/solicitudes';

export const ETIQUETA_TIPO_PREGUNTA: Record<TipoPregunta, string> = {
  TEXTO: 'Texto libre',
  SI_NO: 'Sí o no',
  OPCIONES: 'Opciones',
};

export const OPCIONES_TIPO_PREGUNTA: { valor: TipoPregunta; etiqueta: string }[] = [
  { valor: 'TEXTO', etiqueta: ETIQUETA_TIPO_PREGUNTA.TEXTO },
  { valor: 'SI_NO', etiqueta: ETIQUETA_TIPO_PREGUNTA.SI_NO },
  { valor: 'OPCIONES', etiqueta: ETIQUETA_TIPO_PREGUNTA.OPCIONES },
];
