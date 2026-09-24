/**
 * El formulario de solicitud (GUI-7.1.1) en curso: su forma, su estado inicial, la
 * validación de cada paso y cómo se traduce al cuerpo que espera el backend.
 *
 * Vive aparte de los componentes porque lo comparten los cuatro pasos y el modal que los
 * orquesta. Son funciones puras: se pueden probar sin montar una sola pantalla.
 *
 * La validación de acá es solo de UX — la fuente de verdad es el backend (HU-7.1).
 */
import type {
  EspacioExterior,
  HogarSolicitante,
  HorasSolo,
  NuevaSolicitud,
  TipoSolicitud,
  TipoVivienda,
} from '@/services/solicitudes';
import { aFechaISO, esPasada } from '@/shared/validation/dates';
import { LIMITES } from '@/shared/validation/limits';
import { validarTexto } from '@/shared/validation/text';

export const TOTAL_PASOS = 4;

/** Título de cada paso, en el orden en que se recorren. */
export const TITULOS_PASOS = ['Tipo de solicitud', 'Tu hogar', 'Motivo', 'Confirmación'];

/**
 * Texto literal que exige HU-7.1 cuando falta una punta del período de tránsito. No es el
 * mensaje genérico de campo vacío: la HU lo fija palabra por palabra.
 */
const FALTA_PERIODO = 'Tenés que completar el campo';

/** La mascota sobre la que se solicita, tal como la conoce la pantalla que abre el modal. */
export interface MascotaDeSolicitud {
  publicacionId: number;
  nombre: string | null;
  imagenUrl: string | null;
  /**
   * Viene con guión bajo (`En_Transito`). `BotonSolicitar` lo usa para no ofrecer el botón
   * sobre una mascota que el backend igual va a rechazar (`ESTADO_SOLICITABLE`).
   */
  estado: string;
  /** Renglón de abajo de la tarjeta: refugio y/o ubicación, ya armado. */
  subtitulo?: string | null;
  /** Para el mensaje de éxito: "Enviamos tu solicitud a X". */
  destinatario?: string | null;
}

export interface Borrador {
  tipoSolicitud: TipoSolicitud | null;
  fechaInicioTransito: Date | null;
  fechaFinTransito: Date | null;
  direccion: string;
  tipoVivienda: TipoVivienda | null;
  espacioExterior: EspacioExterior | null;
  tieneNinios: boolean;
  tieneMascotas: boolean;
  detalleMascotas: string;
  experienciaPrevia: boolean;
  horasSolo: HorasSolo | null;
  descripcion: string;
  motivacion: string;
  conforme: boolean;
}

/** Un mensaje por campo con problema. Un paso avanza cuando su porción queda vacía. */
export type Errores = Partial<Record<keyof Borrador, string>>;

/**
 * Con `hogarPrecargado` (lo que ya declaró la vez pasada, vía `/elegibilidad`), el paso 2
 * arranca con las respuestas puestas: mostrarlas como resumen o dejar editarlas es cosa de
 * `PasoHogar`, acá solo importa que el valor de partida sea el real y no uno vacío.
 */
export function borradorInicial(hogarPrecargado?: HogarSolicitante | null): Borrador {
  return {
    tipoSolicitud: null,
    fechaInicioTransito: null,
    fechaFinTransito: null,
    direccion: hogarPrecargado?.direccion ?? '',
    tipoVivienda: (hogarPrecargado?.tipoVivienda as TipoVivienda | null) ?? null,
    espacioExterior: (hogarPrecargado?.espacioExterior as EspacioExterior | null) ?? null,
    tieneNinios: hogarPrecargado?.tieneNinios ?? false,
    tieneMascotas: hogarPrecargado?.tieneMascotas ?? false,
    detalleMascotas: hogarPrecargado?.detalleMascotas ?? '',
    experienciaPrevia: hogarPrecargado?.experienciaPrevia ?? false,
    horasSolo: (hogarPrecargado?.horasSolo as HorasSolo | null) ?? null,
    descripcion: hogarPrecargado?.descripcion ?? '',
    motivacion: '',
    conforme: false,
  };
}

/**
 * Si lo que hay en el borrador difiere de lo que el usuario tenía declarado. Mismo criterio
 * que `sonIguales` del backend (`solicitudes.repository.ts`): compara las mismas respuestas,
 * normalizando los dos campos opcionales igual que `aNuevaSolicitud`.
 *
 * Sirve para decidir si mostrar la advertencia de "estás cambiando tu hogar" al avanzar del
 * paso 2 — nunca para bloquear el envío, que es decisión del backend.
 */
export function hogarCambio(borrador: Borrador, precargado: HogarSolicitante | null): boolean {
  if (!precargado) return false;

  const detalleActual = borrador.tieneMascotas ? borrador.detalleMascotas.trim() || null : null;
  const descripcionActual = borrador.descripcion.trim() || null;

  return (
    borrador.direccion.trim() !== precargado.direccion ||
    borrador.tipoVivienda !== precargado.tipoVivienda ||
    borrador.espacioExterior !== precargado.espacioExterior ||
    borrador.tieneNinios !== precargado.tieneNinios ||
    borrador.tieneMascotas !== precargado.tieneMascotas ||
    detalleActual !== precargado.detalleMascotas ||
    borrador.experienciaPrevia !== precargado.experienciaPrevia ||
    borrador.horasSolo !== precargado.horasSolo ||
    descripcionActual !== precargado.descripcion
  );
}

/** Paso 1: el tipo y, solo si es tránsito, las dos puntas del período. */
function validarTipo(borrador: Borrador): Errores {
  const errores: Errores = {};

  if (!borrador.tipoSolicitud) {
    return { tipoSolicitud: 'Elegí si querés adoptar o ser hogar de tránsito' };
  }

  if (borrador.tipoSolicitud !== 'Transito') return errores;

  const { fechaInicioTransito: inicio, fechaFinTransito: fin } = borrador;

  if (!inicio) errores.fechaInicioTransito = FALTA_PERIODO;
  else if (esPasada(inicio)) errores.fechaInicioTransito = 'La fecha no puede ser anterior a hoy';

  if (!fin) errores.fechaFinTransito = FALTA_PERIODO;
  else if (inicio && fin.getTime() <= inicio.getTime()) {
    errores.fechaFinTransito = 'Tiene que ser posterior a la fecha de inicio';
  }

  return errores;
}

/** Paso 2: las respuestas sobre el hogar. */
function validarHogar(borrador: Borrador): Errores {
  const errores: Errores = {};

  const direccion = validarTexto(borrador.direccion, {
    ...LIMITES.hogar.direccion,
    etiqueta: 'La dirección',
  });
  if (direccion) errores.direccion = direccion;

  if (!borrador.tipoVivienda) errores.tipoVivienda = 'Elegí el tipo de vivienda';
  if (!borrador.espacioExterior) errores.espacioExterior = 'Elegí una opción';
  if (borrador.horasSolo === null) errores.horasSolo = 'Elegí una opción';

  // El detalle solo se valida con el interruptor encendido: apagado ni se muestra.
  if (borrador.tieneMascotas) {
    const detalle = validarTexto(borrador.detalleMascotas, {
      ...LIMITES.hogar.detalleMascotas,
      etiqueta: 'El detalle',
      obligatorio: false,
    });
    if (detalle) errores.detalleMascotas = detalle;
  }

  const descripcion = validarTexto(borrador.descripcion, {
    ...LIMITES.hogar.descripcion,
    etiqueta: 'La descripción',
    obligatorio: false,
  });
  if (descripcion) errores.descripcion = descripcion;

  return errores;
}

/** Paso 3: la motivación, que es lo único obligatorio del paso. */
function validarMotivo(borrador: Borrador): Errores {
  const motivacion = validarTexto(borrador.motivacion, {
    ...LIMITES.solicitud.motivacion,
    etiqueta: 'La motivación',
  });

  return motivacion ? { motivacion } : {};
}

/** Paso 4: la conformidad explícita antes de mandarla. */
function validarConfirmacion(borrador: Borrador): Errores {
  return borrador.conforme ? {} : { conforme: 'Marcá la casilla para confirmar la solicitud' };
}

/** En el orden de los pasos: el índice 0 valida el paso 1. */
export const VALIDADORES = [validarTipo, validarHogar, validarMotivo, validarConfirmacion];

/**
 * Traduce el borrador al cuerpo del `POST`. Solo se llama con los cuatro pasos ya
 * validados, así que los campos obligatorios están cargados.
 *
 * Dos normalizaciones: las fechas viajan solo si el tipo es tránsito, y los textos
 * opcionales vacíos viajan como `null` en vez de como cadena vacía.
 */
export function aNuevaSolicitud(
  borrador: Borrador,
  publicacionId: number,
): NuevaSolicitud {
  const esTransito = borrador.tipoSolicitud === 'Transito';

  return {
    publicacionId,
    tipoSolicitud: borrador.tipoSolicitud!,
    motivacion: borrador.motivacion.trim(),
    ...(esTransito
      ? {
          fechaInicioTransito: aFechaISO(borrador.fechaInicioTransito!),
          fechaFinTransito: aFechaISO(borrador.fechaFinTransito!),
        }
      : {}),
    hogar: {
      direccion: borrador.direccion.trim(),
      tipoVivienda: borrador.tipoVivienda!,
      espacioExterior: borrador.espacioExterior!,
      tieneNinios: borrador.tieneNinios,
      tieneMascotas: borrador.tieneMascotas,
      detalleMascotas: borrador.tieneMascotas ? borrador.detalleMascotas.trim() || null : null,
      experienciaPrevia: borrador.experienciaPrevia,
      horasSolo: borrador.horasSolo!,
      descripcion: borrador.descripcion.trim() || null,
    },
  };
}
