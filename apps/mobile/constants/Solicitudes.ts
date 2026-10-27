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
import type { Ionicons } from '@expo/vector-icons';

import { PALETA } from '@/constants/theme';
import type {
  EspacioExterior,
  EstadoSolicitudNombre,
  HorasSolo,
  MotivoRechazo,
  MotivoSolicitud,
  TipoSolicitud,
  TipoVivienda,
} from '@/services/solicitudes';

export interface OpcionSolicitud<T> {
  valor: T;
  etiqueta: string;
}

/** Enunciado de cada pregunta. La clave es el campo que responde. */
export const PREGUNTAS = {
  tipoSolicitud: '¿Querés adoptar o dar tránsito?',
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
  { valor: 'Transito', etiqueta: 'Dar tránsito' },
];

/** Cómo se ve cada tipo de solicitud: dos colores para que no se confundan de un vistazo. */
export const ESTILO_TIPO_SOLICITUD: Record<
  TipoSolicitud,
  {
    icono: keyof typeof Ionicons.glyphMap;
    /** Fondo suave, para el ícono y las etiquetas. */
    fondo: string;
    /** Texto e ícono sobre el fondo suave. */
    tinta: string;
    /** Relleno de la opción elegida. */
    relleno: string;
    /** Texto sobre el relleno. */
    sobreRelleno: string;
    descripcion: string;
  }
> = {
  Adopcion: {
    icono: 'heart',
    fondo: PALETA.accent[100],
    tinta: PALETA.accent[700],
    relleno: PALETA.accent[600],
    sobreRelleno: PALETA.blanco,
    descripcion: 'Para siempre',
  },
  Transito: {
    icono: 'home',
    fondo: PALETA.calido.amarilloClaro,
    tinta: PALETA.accent[800],
    relleno: PALETA.calido.amarillo,
    sobreRelleno: PALETA.accent[900],
    descripcion: 'Por un tiempo',
  },
};

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

/** Las causas que elige quien rechaza una solicitud, con el rótulo que ve el refugio. */
export const OPCIONES_MOTIVO_RECHAZO: OpcionSolicitud<MotivoRechazo>[] = [
  { valor: 'NO_CUMPLE_REQUISITOS', etiqueta: 'No cumple los requisitos' },
  { valor: 'MASCOTA_CON_HOGAR', etiqueta: 'La mascota ya tiene hogar' },
  { valor: 'SIN_CONTACTO', etiqueta: 'No pudimos contactarte' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

/**
 * Lo que lee quien pidió cuando su solicitud terminó sin ser aceptada. Mismos textos que las
 * notificaciones del backend: la causa se dice con tacto, sin culpar y agradeciendo siempre.
 * Devuelve `null` cuando no hay nada para decir (aprobada, o una que sigue abierta).
 */
export function mensajeDeFinal(
  estado: EstadoSolicitudNombre,
  motivo: MotivoSolicitud | null,
  nombreMascota: string,
): string | null {
  switch (motivo) {
    case 'NO_CUMPLE_REQUISITOS':
      return `El refugio buscaba condiciones puntuales para ${nombreMascota} y esta vez no coincidieron con las de tu hogar. Gracias por animarte a adoptar: hay muchas mascotas que pueden encontrar su hogar con vos.`;
    case 'MASCOTA_CON_HOGAR':
      return `${nombreMascota} ya encontró un hogar. Gracias por tu interés: hay otras mascotas esperándote.`;
    case 'SIN_CONTACTO':
      return 'El refugio no pudo comunicarse con vos. Si todavía te interesa, escribile por el chat.';
    case 'OTRO':
      return 'Esta vez no pudimos avanzar con tu solicitud. Gracias por tu interés.';
    case 'RETIRADA_POR_SOLICITANTE':
      return `Retiraste esta solicitud. Si cambiás de idea, podés volver a solicitar a ${nombreMascota}.`;
    case 'ADOPTADA_POR_OTRA_PERSONA':
      return `${nombreMascota} ya encontró su hogar. Gracias por haberte interesado: hay muchas mascotas esperándote.`;
    case 'MASCOTA_FALLECIDA':
      return `Con mucha tristeza te contamos que ${nombreMascota} falleció. Gracias por tu interés y tu cariño.`;
    case 'PUBLICACION_RETIRADA':
      return `La publicación de ${nombreMascota} se retiró, por eso cerramos tu solicitud. Si querés saber más, escribile por el chat.`;
    case 'PUBLICANTE_CERRO_CUENTA':
      return `Quien publicó a ${nombreMascota} cerró su cuenta, así que cerramos tu solicitud. Lamentamos las molestias.`;
    case 'VENCIDA_SIN_RESPUESTA':
      return `Pasó mucho tiempo sin novedades y cerramos tu solicitud por ${nombreMascota}. No es por vos: podés volver a solicitarla cuando quieras.`;
    default:
      return estado === 'Cancelada' || estado === 'Cerrada' || estado === 'Rechazada'
        ? 'Esta solicitud ya terminó. Gracias por tu interés.'
        : null;
  }
}

/** Salvo cuando la mascota falleció: ahí no corresponde ofrecer "ver otras mascotas". */
export function ofreceSeguirExplorando(motivo: MotivoSolicitud | null): boolean {
  return motivo !== 'MASCOTA_FALLECIDA';
}

/** La causa dicha de forma corta y factual, para el historial que lee quien publicó. */
export const ETIQUETA_MOTIVO: Record<MotivoSolicitud, string> = {
  NO_CUMPLE_REQUISITOS: 'No cumple los requisitos',
  MASCOTA_CON_HOGAR: 'La mascota ya tiene hogar',
  SIN_CONTACTO: 'No pudimos contactarte',
  OTRO: 'Otro motivo',
  RETIRADA_POR_SOLICITANTE: 'La retiró la persona',
  CUENTA_CERRADA_SOLICITANTE: 'La persona cerró su cuenta',
  ADOPTADA_POR_OTRA_PERSONA: 'La mascota fue adoptada',
  MASCOTA_FALLECIDA: 'La mascota falleció',
  PUBLICACION_RETIRADA: 'Se retiró la publicación',
  PUBLICANTE_CERRO_CUENTA: 'Quien publicó cerró su cuenta',
  VENCIDA_SIN_RESPUESTA: 'Venció sin respuesta',
};
