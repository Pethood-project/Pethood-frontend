/**
 * Textos y reglas de presentación de las campañas (specs 026 y 028 del backend). Puro, sin
 * React: se testea con `node --test`.
 */

/** «$1.430.000» como en el diseño; con centavos sólo si los hay («$5.000,50»). */
export function formatearPesos(monto: number): string {
  const [entero, centavos] = Math.abs(monto).toFixed(2).split('.');
  const conPuntos = entero!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const signo = monto < 0 ? '-' : '';

  return centavos === '00' ? `${signo}$${conPuntos}` : `${signo}$${conPuntos},${centavos}`;
}

export function textoDonantes(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'donante' : 'donantes'}`;
}

/** El aviso de la tarjeta del refugio. Sin pendientes no se muestra nada. */
export function textoPendientes(cantidad: number): string | null {
  if (cantidad === 0) return null;
  return `Tenés ${cantidad} ${cantidad === 1 ? 'donación' : 'donaciones'} para revisar`;
}

/**
 * Las que todavía no cerraron: cuentan para el límite de campañas por refugio (spec 026 §6.3)
 * y se pueden editar o finalizar (spec 028). La Pausada cuenta porque se puede reactivar.
 */
const ESTADOS_VIGENTES = ['Inactiva', 'Activa', 'Pausada'];

export type AccionCampania = 'pausar' | 'reactivar' | 'finalizar' | 'eliminar';

/**
 * Qué puede hacer el refugio con la campaña según su estado. Espejo de la máquina de estados
 * del backend (spec 028 §6.1): el backend igual valida, esto sólo decide qué botones mostrar.
 * «Eliminar» sólo aparece si nadie avisó nunca que donó; si no, queda «Finalizar».
 */
export function accionesDisponibles(estado: string, tieneDonaciones: boolean): AccionCampania[] {
  const acciones: AccionCampania[] = [];

  if (estado === 'Activa') acciones.push('pausar');
  if (estado === 'Pausada') acciones.push('reactivar');
  if (ESTADOS_VIGENTES.includes(estado)) acciones.push('finalizar');
  if (!tieneDonaciones) acciones.push('eliminar');

  return acciones;
}

export function puedeEditar(estado: string): boolean {
  return ESTADOS_VIGENTES.includes(estado);
}

/**
 * Ids de los estados vigentes según el catálogo, para preguntar cuántas campañas cuentan para
 * el límite antes de abrir el alta. Sin catálogo devuelve `[]` y la pantalla deja que decida
 * el backend al confirmar.
 */
export function idsDeEstadosVigentes(catalogo: { id: number; nombre: string }[]): number[] {
  return catalogo
    .filter((estado) => ESTADOS_VIGENTES.includes(estado.nombre))
    .map((estado) => estado.id);
}

/**
 * Por qué no se puede donar a esta campaña, o `null` si se puede. La pantalla lo muestra en
 * lugar del alias/CBU: avisarlo después de que alguien transfirió es tarde.
 */
export function motivoParaNoDonar(campania: {
  estado: { nombre: string };
  alias: string | null;
  cbu: string | null;
}): string | null {
  if (campania.estado.nombre === 'Pausada') {
    return 'El refugio pausó esta campaña. Por ahora no está recibiendo donaciones.';
  }
  if (campania.estado.nombre !== 'Activa') return 'Esta campaña ya no está recibiendo donaciones.';
  if (!campania.alias && !campania.cbu) {
    return 'Esta campaña todavía no cargó un alias ni un CBU para transferir.';
  }
  return null;
}

/**
 * Desde dónde transfiere el donante (spec 027). Sólo las de Mercado Pago se confirman solas:
 * en una transferencia desde otro banco, Mercado Pago no informa quién la hizo.
 */
export type OrigenDonacion = 'MERCADO_PAGO' | 'OTRO_BANCO';

const NOTA_MANUAL =
  'Tu donación se suma a la campaña cuando el refugio confirme que recibió la transferencia.';

/** La nota de «Donar» según desde dónde va a transferir y si el refugio confirma solo. */
export function notaDonar(origen: OrigenDonacion | null, confirmacionAutomatica: boolean): string {
  if (origen === 'OTRO_BANCO') {
    return 'El refugio va a revisar que la transferencia haya llegado y la va a confirmar.';
  }
  if (origen === 'MERCADO_PAGO' && confirmacionAutomatica)
    return 'Se confirma sola en unos minutos.';
  return NOTA_MANUAL;
}

/**
 * Cómo ve el refugio el origen de una donación en «Revisar donaciones»: de dónde vino y, si está
 * Pendiente, si se va a confirmar sola o la tiene que aplicar a mano. `null` en donaciones
 * anteriores al campo.
 */
export function origenDeDonacion(
  origen: OrigenDonacion | null,
  pendiente: boolean,
  refugioVinculado: boolean,
): { etiqueta: string; ayuda: string | null } | null {
  if (!origen) return null;

  const etiqueta = origen === 'MERCADO_PAGO' ? 'Desde Mercado Pago' : 'Desde otro banco';
  if (!pendiente) return { etiqueta, ayuda: null };

  const sola = origen === 'MERCADO_PAGO' && refugioVinculado;
  return { etiqueta, ayuda: sola ? 'Se confirma sola' : 'Revisá tu cuenta y aplicala a mano' };
}

/** Motivos de rechazo de una donación, como los ve el refugio. */
export const ETIQUETA_MOTIVO = {
  NO_RECIBIDA: 'No se recibió la transferencia',
  MONTO_NO_COINCIDE: 'El monto no coincide',
} as const;

export type MotivoRechazo = keyof typeof ETIQUETA_MOTIVO;
