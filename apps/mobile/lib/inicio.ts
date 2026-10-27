/**
 * Textos y cálculos de la pantalla de Inicio, sacados de los componentes para poder
 * probarlos sin React Native (ver `inicio.test.ts`).
 *
 * Funciones puras. Sólo importan tipos, que el borrado de tipos de Node hace desaparecer.
 */
import type { EstadoSolicitudNombre } from '@/services/solicitudes';
import type { SolicitudEnSeguimiento } from '@/services/seguimiento';

/** "1 solicitud" / "3 solicitudes". */
export function conPlural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/**
 * Título de la tarjeta grande de Adoptar. Cuenta lo que devuelve el feed: ya viene sin las
 * mascotas propias ni las guardadas en favoritos.
 */
export function tituloAdoptar(total: number): string {
  if (total === 0) return 'Todavía no hay peludos para adoptar';
  return total === 1 ? '1 peludo busca familia' : `${total} peludos buscan familia`;
}

/**
 * Cuántos de los cuatro tramos de la barrita de "Mis solicitudes" van pintados: enviada,
 * en revisión, revisada, aprobada. Una rechazada, cancelada o cerrada no avanzó hasta el
 * final y no tiene barra.
 */
export function pasoDeSolicitud(estado: EstadoSolicitudNombre): number {
  if (estado === 'Pendiente') return 1;
  if (estado === 'En_Revision') return 2;
  if (estado === 'Revisada') return 3;
  if (estado === 'Aprobada') return 4;
  return 0;
}

export const PASOS_SOLICITUD = 4;

const MESES_CORTOS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
] as const;

/** La hojita de almanaque de la tarjeta de seguimiento: `{ mes: 'AGO', dia: '15' }`, en hora local. */
export function hojaDeAlmanaque(iso: string): { mes: string; dia: string } | null {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return { mes: MESES_CORTOS[fecha.getMonth()]!, dia: String(fecha.getDate()) };
}

/**
 * Convierte la salida compacta de `tiempoRelativo` ("5 min", "Ayer", "Ahora") en algo que
 * se lee dentro de una frase: "hace 5 min", "ayer", "recién".
 */
export function dentroDeFrase(relativo: string): string {
  if (relativo === 'Ahora') return 'recién';
  if (relativo === 'Ayer') return 'ayer';
  return `hace ${relativo}`;
}

/**
 * Qué seguimiento del adoptante mostrar en Inicio, entre los que siguen en curso: primero
 * el que tiene un pedido esperando foto (el de plazo más corto), y si no hay ninguno, el
 * que tiene el próximo pedido más cercano.
 */
export function seguimientoDestacado(
  seguimientos: SolicitudEnSeguimiento[],
): SolicitudEnSeguimiento | null {
  const enCurso = seguimientos.filter((s) => s.rol === 'ADOPTANTE' && !s.finalizado);

  const conPedido = enCurso
    .filter((s) => s.pendiente !== null)
    .sort((a, b) => instante(a.pendiente?.plazo) - instante(b.pendiente?.plazo));
  if (conPedido.length > 0) return conPedido[0]!;

  const conProximo = enCurso
    .filter((s) => s.proximoAviso !== null)
    .sort((a, b) => instante(a.proximoAviso) - instante(b.proximoAviso));

  return conProximo[0] ?? enCurso[0] ?? null;
}

/** Sin fecha va al final: `Infinity` y no `NaN`, que rompería el orden. */
function instante(iso: string | null | undefined): number {
  const valor = iso ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(valor) ? Number.POSITIVE_INFINITY : valor;
}
