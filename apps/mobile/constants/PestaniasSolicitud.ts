/**
 * Las tres formas de agrupar lo recibido —por revisar, revisadas y resueltas—, con los estados
 * que reúne cada una. Las usan el listado (para saber qué mostrar al entrar) y el modal de
 * filtros (donde se eligen).
 */
import type { EstadoSolicitudNombre } from '@/services/solicitudes';

export type Pestania = 'porRevisar' | 'revisadas' | 'resueltas';

export const ESTADOS_DE_PESTANIA: Record<Pestania, EstadoSolicitudNombre[]> = {
  porRevisar: ['Pendiente', 'En_Revision'],
  revisadas: ['Revisada'],
  resueltas: ['Aprobada', 'Rechazada', 'Cancelada', 'Cerrada'],
};

export const OPCIONES_PESTANIA: { valor: Pestania; etiqueta: string }[] = [
  { valor: 'porRevisar', etiqueta: 'Por revisar' },
  { valor: 'revisadas', etiqueta: 'Revisadas' },
  { valor: 'resueltas', etiqueta: 'Resueltas' },
];

/** La pestaña cuyo conjunto de estados coincide con el filtro, si alguna coincide. */
export function pestaniaDe(estados: EstadoSolicitudNombre[] | undefined): Pestania | null {
  if (!estados) return null;

  const claves = Object.keys(ESTADOS_DE_PESTANIA) as Pestania[];
  return (
    claves.find((clave) => {
      const del = ESTADOS_DE_PESTANIA[clave];
      return del.length === estados.length && del.every((estado) => estados.includes(estado));
    }) ?? null
  );
}
