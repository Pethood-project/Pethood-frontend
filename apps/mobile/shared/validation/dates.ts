/**
 * Utilidades de fecha reutilizables. Funciones puras, sin dependencias.
 * Espejo de `pethood-backend/src/shared/validation/dates.ts`.
 *
 * El espejo cubre las funciones de validación. Las de FORMATO para el usuario
 * (`edadEnTexto`, `aFechaVisible`, `tiempoRelativo`) viven sólo acá y no tienen par en el
 * backend a propósito: el servidor manda siempre la fecha cruda en ISO 8601 y el texto lo
 * arma el cliente, porque un texto calculado en el servidor queda viejo apenas se cachea.
 */
import { LIMITES } from './limits';

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parsea texto ISO o Date. Devuelve null si no es una fecha real.
 * Un `AAAA-MM-DD` se arma como medianoche local: interpretarlo como UTC corre el día.
 */
export function parsearFecha(valor: string | Date | null | undefined): Date | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;

  const partes = SOLO_FECHA.exec(valor);
  const fecha = partes
    ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
    : new Date(valor);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function finDelDia(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(23, 59, 59, 999);
  return copia;
}

export function inicioDelDia(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

/** Compara contra el fin del día de hoy, así una fecha de hoy nunca cuenta como futura. */
export function esFutura(fecha: Date, hoy: Date = new Date()): boolean {
  return fecha.getTime() > finDelDia(hoy).getTime();
}

/** Compara contra el inicio del día de hoy, así una fecha de hoy no cuenta como pasada. */
export function esPasada(fecha: Date, hoy: Date = new Date()): boolean {
  return fecha.getTime() < inicioDelDia(hoy).getTime();
}

export function esAnteriorAlAnioMinimo(
  fecha: Date,
  anioMinimo: number = LIMITES.fecha.anioMinimo,
): boolean {
  return fecha.getFullYear() < anioMinimo;
}

/** Formatea a `AAAA-MM-DD` en hora local — `toISOString` corre el día según timezone. */
export function aFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Edad en texto a partir de la fecha de nacimiento: "3 años", "5 meses", "recién nacido". */
export function edadEnTexto(fechaNacimiento: Date, hoy: Date = new Date()): string {
  const meses =
    (hoy.getFullYear() - fechaNacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - fechaNacimiento.getMonth()) -
    (hoy.getDate() < fechaNacimiento.getDate() ? 1 : 0);

  if (meses < 1) return 'Recién nacido';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;

  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
}

/**
 * Largo de un período en texto: "3 meses", "20 días", "1 año y 2 meses". Para mostrar de
 * un vistazo cuánto dura un tránsito sin obligar a restar dos fechas mentalmente.
 */
export function duracionEnTexto(desde: Date, hasta: Date): string {
  const meses =
    (hasta.getFullYear() - desde.getFullYear()) * 12 +
    (hasta.getMonth() - desde.getMonth()) -
    (hasta.getDate() < desde.getDate() ? 1 : 0);

  if (meses < 1) {
    const dias = Math.max(1, diasCalendarioEntre(desde, hasta));
    return `${dias} ${dias === 1 ? 'día' : 'días'}`;
  }

  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;

  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const enAnios = `${anios} ${anios === 1 ? 'año' : 'años'}`;

  return resto === 0 ? enAnios : `${enAnios} y ${resto} ${resto === 1 ? 'mes' : 'meses'}`;
}

const UN_MINUTO = 60_000;
const UNA_HORA = 60 * UN_MINUTO;
const UN_DIA = 24 * UNA_HORA;

/** Días calendario enteros entre dos instantes, ignorando la hora del día. */
function diasCalendarioEntre(desde: Date, hasta: Date): number {
  const diferencia = inicioDelDia(hasta).getTime() - inicioDelDia(desde).getTime();
  return Math.round(diferencia / UN_DIA);
}

/**
 * Antigüedad de un mensaje para la lista de conversaciones (HU-5.1, criterio 6):
 * "Recién" · "Hace 5 min" · "Hace 1 hora" · "Hace 3 horas" · "Ayer" · "Hace 4 días".
 *
 * Los tramos se evalúan por tiempo transcurrido y NO por día calendario, salvo "Ayer".
 * Por eso un mensaje de ayer a las 23:00 leído hoy a las 10:00 dice "Hace 11 horas" y no
 * "Ayer": pasaron 11 horas, y el criterio pone "Ayer" recién después de las 24.
 *
 * `ahora` se puede inyectar para poder probar la función sin depender del reloj.
 */
export function tiempoRelativo(fecha: Date, ahora: Date = new Date()): string {
  const transcurrido = ahora.getTime() - fecha.getTime();

  // Un reloj adelantado o una fecha del futuro no deberían mostrar un negativo.
  if (transcurrido < UN_MINUTO) return 'Recién';

  // "min" es abreviatura y no se pluraliza: "Hace 1 min" y "Hace 5 min" son las dos
  // correctas. Horas y días sí llevan singular, más abajo.
  if (transcurrido < UNA_HORA) {
    return `Hace ${Math.floor(transcurrido / UN_MINUTO)} min`;
  }

  if (transcurrido < UN_DIA) {
    const horas = Math.floor(transcurrido / UNA_HORA);
    return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }

  // Pasadas las 24 h, "Ayer" sólo si además cae en el día calendario anterior. Con más de
  // 24 h de diferencia eso ocurre únicamente cuando el mensaje es de bien temprano y ahora
  // es bien tarde; en cualquier otro caso ya son dos o más días.
  if (diasCalendarioEntre(fecha, ahora) === 1) return 'Ayer';

  const dias = Math.floor(transcurrido / UN_DIA);
  return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/**
 * Lo que falta para una fecha futura, sin preposición: "12 min", "5 horas", "3 días".
 * Devuelve `null` si la fecha ya pasó, para que quien llama muestre el estado vencido en
 * lugar de una cuenta regresiva en cero.
 *
 * Es el espejo futuro de `tiempoRelativo` y comparte sus tramos. Lo usa el seguimiento
 * post-adopción (HU-9.1/9.2) para el plazo de 48 h y para el próximo pedido, así que la
 * unidad más chica sigue siendo el minuto: al plazo le sobra precisión con eso.
 *
 * Redondea hacia arriba a propósito: a falta de 90 minutos es más honesto decir "2 horas"
 * que "1 hora", porque quien lee está calculando cuánto margen le queda.
 */
export function tiempoHasta(fecha: Date, ahora: Date = new Date()): string | null {
  const restante = fecha.getTime() - ahora.getTime();

  if (restante <= 0) return null;

  if (restante < UNA_HORA) {
    return `${Math.max(1, Math.ceil(restante / UN_MINUTO))} min`;
  }

  if (restante < UN_DIA) {
    const horas = Math.ceil(restante / UNA_HORA);
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }

  const dias = Math.ceil(restante / UN_DIA);
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/**
 * Hora del día en 24 h: "10:30". Es lo que va dentro de la burbuja de un mensaje (GUI-14).
 *
 * No se resuelve con `tiempoRelativo`: ese contesta "cuánto hace" y sirve para ordenar una
 * bandeja de entrada (HU-5.1), mientras que dentro de una conversación lo que importa es a
 * qué hora se dijo cada cosa.
 *
 * Va con `getHours`/`getMinutes` y no con `toLocaleTimeString` porque el formato de éste
 * depende del locale del dispositivo: en un teléfono en inglés saldría "10:30 AM" y la
 * burbuja quedaría más ancha de lo que el diseño previó.
 */
export function horaVisible(fecha: Date): string {
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/** Formato para mostrar al usuario. */
export function aFechaVisible(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

/** Fecha de algo que ya pasó: existente, no futura y ≥ al año mínimo. */
export function validarFechaPasada(
  valor: string | Date | null | undefined,
  etiqueta: string,
): string | null {
  const fecha = parsearFecha(valor);

  if (!fecha) return `${etiqueta} es obligatoria`;
  if (esFutura(fecha)) return `${etiqueta} no puede ser futura`;
  if (esAnteriorAlAnioMinimo(fecha)) {
    return `${etiqueta} no puede ser anterior a ${LIMITES.fecha.anioMinimo}`;
  }

  return null;
}

/**
 * Fecha de algo que todavía no pasó (próximo control de la historia clínica): opcional,
 * pero si viene tiene que ser estrictamente posterior a hoy.
 */
export function validarFechaFutura(
  valor: string | Date | null | undefined,
  etiqueta: string,
): string | null {
  if (valor === null || valor === undefined || valor === '') return null;

  const fecha = parsearFecha(valor);
  if (!fecha) return `${etiqueta} no es válida`;
  if (!esFutura(fecha)) return `${etiqueta} debe ser posterior a hoy`;

  return null;
}
