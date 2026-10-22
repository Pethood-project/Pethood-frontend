/**
 * Color de cada vacuna, en un solo lugar. Es fijo por tipo: una misma vacuna se ve igual en
 * la ficha de la mascota, en la publicación y en la historia clínica. Los valores salen de
 * `PALETA.vacuna` (`constants/theme.js`).
 */
import { PALETA } from '@/constants/theme';
import type { TipoVacuna } from '@/services/vacunas';

export interface EstiloVacuna {
  fondo: string;
  borde: string;
  /** Ícono y texto. */
  tinta: string;
}

/** Las 7 vacunas del plan original. Una vacuna nueva del catálogo cae en el estilo por defecto. */
const ESTILOS: Record<TipoVacuna, EstiloVacuna | undefined> = {
  PRIMOVACUNACION: PALETA.vacuna.primovacunacion,
  MULTIPLE: PALETA.vacuna.multiple,
  REFUERZO_MULTIPLE: PALETA.vacuna.refuerzoMultiple,
  ANTIRRABICA: PALETA.vacuna.antirrabica,
  TRIVALENTE_FELINA: PALETA.vacuna.trivalenteFelina,
  REFUERZO_TRIVALENTE_LEUCEMIA: PALETA.vacuna.refuerzoTrivalenteLeucemia,
  REFUERZO_LEUCEMIA: PALETA.vacuna.refuerzoLeucemia,
};

/** Un tipo que el admin sume al catálogo cae en el acento de marca, no en blanco. */
export function estiloDeVacuna(tipo: TipoVacuna): EstiloVacuna {
  return ESTILOS[tipo] ?? PALETA.vacuna.primovacunacion;
}
