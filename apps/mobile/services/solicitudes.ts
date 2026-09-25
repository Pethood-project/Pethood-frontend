/**
 * Solicitudes, de las dos puntas: crearla y seguirla (HU-7.1 / HU-7.3) y la bandeja de
 * quien publicó la mascota (HU-7.4 resolver, HU-7.5 listado/detalle).
 *
 * "Quien publicó la mascota" no es siempre un refugio: un adoptante particular también
 * puede gestionar acá las solicitudes de una mascota propia. Contrato en
 * `pethood-backend/docs/specs/003-adopcion-favoritos.md`.
 */
import { get, patch, post } from './api';
import { aFechaISO } from '../shared/validation/dates';

/** Nombres reales del catálogo EstadoSolicitud (prisma/seed.ts del backend). */
export type EstadoSolicitudNombre =
  | 'Pendiente'
  | 'En_Revision'
  | 'Aprobada'
  | 'Rechazada'
  | 'Cancelada';

/** El refugio/adoptante solo puede resolver una solicitud "Pendiente" hacia uno de estos dos destinos. */
export type EstadoResolucion = Extract<EstadoSolicitudNombre, 'Aprobada' | 'Rechazada'>;

/** Nombres reales del catálogo TipoSolicitud. Sin tilde: son los valores de la base. */
export type TipoSolicitud = 'Adopcion' | 'Transito';

/** Período ofrecido en una solicitud de tránsito. Null cuando el tipo es "Adopcion". */
export interface PeriodoTransito {
  /** `AAAA-MM-DD`: es un día del calendario, no un instante. */
  fechaInicio: string;
  fechaFin: string;
}

export interface SolicitudResumen {
  id: number;
  publicacionId: number;
  mascota: { id: number; nombre: string | null; imagenUrl: string | null };
  solicitante: { id: number; nombre: string; apellido: string };
  tipoSolicitud: string;
  estado: { id: number; nombre: EstadoSolicitudNombre };
  comentario: string | null;
  transito: PeriodoTransito | null;
  fechaAlta: string;
  fechaRespuesta: string | null;
}

/** Una fila del histórico, ordenado del estado más reciente al más viejo. */
export interface EstadoSolicitudHistorial {
  id: number;
  nombre: EstadoSolicitudNombre;
  fecha: string;
}

/** Respuestas cerradas del paso 2 de GUI-7.1.1. Sin tilde: son los valores de la base. */
export type TipoVivienda = 'Casa' | 'Departamento' | 'Otro';
export type EspacioExterior = 'Balcon' | 'Patio' | 'Jardin' | 'Ninguno';

/** Los tres chips de "¿Cuántas horas por día quedaría sola?", como tope del rango. */
export type HorasSolo = 4 | 8 | 12;

/** El hogar declarado en el paso 2. Se guarda en la clase `Hogar` del modelo. */
export interface HogarSolicitud {
  direccion: string;
  tipoVivienda: TipoVivienda;
  espacioExterior: EspacioExterior;
  tieneNinios: boolean;
  tieneMascotas: boolean;
  /** Solo se manda con `tieneMascotas` en true; el backend lo descarta si no. */
  detalleMascotas: string | null;
  experienciaPrevia: boolean;
  horasSolo: HorasSolo;
  descripcion: string | null;
}

/** El hogar tal como lo lee quien resuelve la solicitud (GUI "Detalle recibido"). */
export interface HogarSolicitante {
  direccion: string;
  tipoVivienda: string | null;
  espacioExterior: string | null;
  tieneNinios: boolean;
  tieneMascotas: boolean;
  detalleMascotas: string | null;
  experienciaPrevia: boolean;
  horasSolo: number | null;
  descripcion: string | null;
}

/**
 * El hogar vigente HOY, solo cuando no es el mismo que se declaró al enviar la solicitud:
 * el solicitante se mudó o corrigió sus datos después. Es la señal de control para quien
 * resuelve. Null en el caso normal (no cambió nada).
 */
export interface CambioDeHogar {
  hogar: HogarSolicitante;
  /** Cuándo se cargó la versión vigente. */
  fechaCambio: string;
}

export interface SolicitudDetalle extends SolicitudResumen {
  motivacion: string;
  /**
   * Lo que el solicitante declaró al enviar — lo que se está evaluando. Null en solicitudes
   * anteriores a HU-7.1, cuando el formulario no pedía hogar.
   */
  hogar: HogarSolicitante | null;
  /** Solo viene si el hogar cambió después de enviar esta solicitud. */
  cambioDeHogar: CambioDeHogar | null;
  historial: EstadoSolicitudHistorial[];
}

/** Lo que se manda al crear (HU-7.1). Las fechas van solo si el tipo es "Transito". */
export interface NuevaSolicitud {
  publicacionId: number;
  tipoSolicitud: TipoSolicitud;
  motivacion: string;
  /** `AAAA-MM-DD`. */
  fechaInicioTransito?: string;
  fechaFinTransito?: string;
  hogar: HogarSolicitud;
}

/** Por qué el sistema frena la solicitud antes de abrir el formulario. */
export type MotivoBloqueo =
  | 'PUBLICACION_PROPIA'
  | 'NO_VERIFICADO'
  | 'LIMITE_ALCANZADO'
  | 'YA_SOLICITADA';

/**
 * Chequeo previo de las precondiciones de HU-7.1. Se consulta al tocar "Solicitar
 * adopción": si `puedeSolicitar` es false se muestra el cartel del motivo en vez del
 * formulario, para no hacerle completar cuatro pasos a quien no puede solicitar.
 */
export interface Elegibilidad {
  puedeSolicitar: boolean;
  motivo: MotivoBloqueo | null;
  /** Texto literal que la HU fija para ese motivo, o null. */
  mensaje: string | null;
  verificado: boolean;
  pendientes: number;
  maximo: number;
  /** Solicitud viva sobre esa publicación, para el CTA "Ver mi solicitud". */
  solicitudAbiertaId: number | null;
  /**
   * Hogar vigente del usuario, o null si nunca cargó uno. Con esto el paso 2 arranca
   * mostrando un resumen de lo ya declarado, en vez de ocho campos vacíos.
   */
  hogar: HogarSolicitante | null;
}

export interface ListaSolicitudesRecibidas {
  /** Total que matchea el filtro, no el largo de esta página. */
  total: number;
  solicitudes: SolicitudResumen[];
}

/** Tope de página que acepta el backend (`filtrosRecibidasSchema`). */
const LIMITE_MAXIMO = 50;

/**
 * Recorte por estado y por `fechaAlta` (las dos puntas inclusive). `estados` admite varios a
 * la vez (trae las que están en cualquiera); vacío o ausente es "todos".
 */
export interface FiltrosSolicitudes {
  estados?: EstadoSolicitudNombre[];
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export const SIN_FILTROS_SOLICITUDES: FiltrosSolicitudes = {};

/** Para el contador del ícono de filtros ("options-outline") y el botón "Aplicar (N)". */
export function contarFiltrosActivosSolicitudes(filtros: FiltrosSolicitudes): number {
  let activos = 0;

  // Elegir varios estados es una sola elección del usuario: cuenta como un filtro.
  if (filtros.estados && filtros.estados.length > 0) activos += 1;
  // El rango de fecha es una sola elección del usuario aunque viaje en dos campos.
  if (filtros.fechaDesde !== undefined || filtros.fechaHasta !== undefined) activos += 1;

  return activos;
}

function queryDeFiltros(filtros: FiltrosSolicitudes): string {
  const params = new URLSearchParams({ limite: String(LIMITE_MAXIMO) });
  if (filtros.estados && filtros.estados.length > 0) {
    params.set('estados', filtros.estados.join(','));
  }
  if (filtros.fechaDesde) params.set('fechaDesde', aFechaISO(filtros.fechaDesde));
  if (filtros.fechaHasta) params.set('fechaHasta', aFechaISO(filtros.fechaHasta));
  return `?${params.toString()}`;
}

/**
 * Sin paginación en la UI: una sola página al tope permitido por el backend.
 * ponytail: si algún refugio supera las 50 solicitudes recibidas en un mismo estado, sumar
 * "cargar más" acá y en la pantalla.
 */
export function listarRecibidas(filtros: FiltrosSolicitudes = {}): Promise<ListaSolicitudesRecibidas> {
  return get(`/solicitudes/recibidas${queryDeFiltros(filtros)}`);
}

/**
 * Historial propio del solicitante (HU-7.3). Mismo contrato que `listarRecibidas`: la
 * pantalla de Solicitudes usa la misma tarjeta para las dos pestañas.
 */
export function listarMias(filtros: FiltrosSolicitudes = {}): Promise<ListaSolicitudesRecibidas> {
  return get(`/solicitudes/mias${queryDeFiltros(filtros)}`);
}

/**
 * Precondiciones de HU-7.1. `publicacionId` es opcional: sin él solo se evalúa al usuario
 * (verificación y tope de pendientes); con él se agrega "ya solicitaste esta mascota" y
 * "es tu propia mascota" (o de tu refugio). Solo existe en el perfil personal.
 */
export function obtenerElegibilidad(publicacionId?: number): Promise<Elegibilidad> {
  const params = new URLSearchParams();
  if (publicacionId !== undefined) params.set('publicacionId', String(publicacionId));
  const query = params.toString();
  return get(`/solicitudes/elegibilidad${query ? `?${query}` : ''}`);
}

/** HU-7.1. Devuelve la solicitud ya creada, en estado "Pendiente". */
export function crearSolicitud(datos: NuevaSolicitud): Promise<SolicitudDetalle> {
  return post('/solicitudes', datos);
}

export function obtenerSolicitud(id: number): Promise<SolicitudDetalle> {
  return get(`/solicitudes/${id}`);
}

export function resolverSolicitud(
  id: number,
  estado: EstadoResolucion,
  comentario: string,
): Promise<SolicitudDetalle> {
  return patch(`/solicitudes/${id}/estado`, {
    estado,
    ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
  });
}
