/**
 * Textos y opciones del formulario de solicitud (GUI-7.1.1), en un solo lugar.
 *
 * Las preguntas viven acá y no dentro del formulario porque el detalle que lee el refugio
 * muestra exactamente las mismas: si se escribieran dos veces, el día que cambie una
 * redacción quedarían diciendo cosas distintas sobre el mismo dato.
 *
 * Los valores son los del catálogo del backend, sin tildes ni espacios; la etiqueta
 * visible sale de estas tablas.
 */
import type {
  EspacioExterior,
  HorasSolo,
  TipoSolicitud,
  TipoVivienda,
} from '@/services/solicitudes';

export interface OpcionSolicitud<T> {
  valor: T;
  etiqueta: string;
}

/** Enunciado de cada pregunta. La clave es el campo que responde. */
export const PREGUNTAS = {
  tipoSolicitud: '¿Qué querés hacer?',
  fechaInicioTransito: '¿Desde cuándo podés recibirla?',
  fechaFinTransito: '¿Hasta cuándo?',
  direccion: '¿Dónde vivís?',
  tipoVivienda: '¿En qué tipo de vivienda?',
  espacioExterior: '¿Tenés espacios al aire libre?',
  tieneNinios: '¿Vive algún niño en tu casa?',
  tieneMascotas: '¿Tenés otras mascotas?',
  experienciaPrevia: '¿Tuviste mascotas antes?',
  horasSolo: '¿Cuántas horas por día quedaría sola?',
  descripcion: 'Contanos algo más sobre tu casa',
} as const;

export const OPCIONES_TIPO_SOLICITUD: OpcionSolicitud<TipoSolicitud>[] = [
  { valor: 'Adopcion', etiqueta: 'Adoptar' },
  { valor: 'Transito', etiqueta: 'Ser hogar de tránsito' },
];

export const OPCIONES_TIPO_VIVIENDA: OpcionSolicitud<TipoVivienda>[] = [
  { valor: 'Casa', etiqueta: 'Casa' },
  { valor: 'Departamento', etiqueta: 'Departamento' },
  { valor: 'Otro', etiqueta: 'Otro' },
];

export const OPCIONES_ESPACIO_EXTERIOR: OpcionSolicitud<EspacioExterior>[] = [
  { valor: 'Balcon', etiqueta: 'Balcón' },
  { valor: 'Patio', etiqueta: 'Patio' },
  { valor: 'Jardin', etiqueta: 'Jardín' },
  { valor: 'Ninguno', etiqueta: 'Ninguno' },
];

/** El valor guardado es el TOPE del rango, no la cantidad exacta de horas. */
export const OPCIONES_HORAS_SOLO: OpcionSolicitud<HorasSolo>[] = [
  { valor: 4, etiqueta: 'Menos de 4' },
  { valor: 8, etiqueta: 'Entre 4 y 8' },
  { valor: 12, etiqueta: 'Más de 8' },
];

/** Cómo se nombra el tipo cuando ya no es una opción a elegir sino un dato de la solicitud. */
const NOMBRES_TIPO: Record<string, string> = {
  Adopcion: 'Adopción definitiva',
  Transito: 'Hogar de tránsito',
};

export function etiquetaTipoSolicitud(valor: string): string {
  return NOMBRES_TIPO[valor] ?? valor;
}

/** Busca la etiqueta de un valor guardado. Devuelve el valor crudo si no está en la tabla. */
function etiquetaDe<T>(opciones: OpcionSolicitud<T>[], valor: T | null): string | null {
  if (valor === null) return null;
  return opciones.find((opcion) => opcion.valor === valor)?.etiqueta ?? String(valor);
}

export function etiquetaTipoVivienda(valor: string | null): string | null {
  return etiquetaDe(OPCIONES_TIPO_VIVIENDA, valor as TipoVivienda | null);
}

export function etiquetaEspacioExterior(valor: string | null): string | null {
  return etiquetaDe(OPCIONES_ESPACIO_EXTERIOR, valor as EspacioExterior | null);
}

/** "Entre 4 y 8 horas por día", para el resumen y el detalle del refugio. */
export function etiquetaHorasSolo(valor: number | null): string | null {
  const etiqueta = etiquetaDe(OPCIONES_HORAS_SOLO, valor as HorasSolo | null);
  return etiqueta === null ? null : `${etiqueta} horas por día`;
}

export function respuestaSiNo(valor: boolean): string {
  return valor ? 'Sí' : 'No';
}
