/**
 * HU-9.1/HU-9.2 Seguimiento post-adopción. Contratos en
 * `pethood-backend/docs/specs/011-seguimiento-post-adopcion.md`.
 *
 * Un "seguimiento" acá es un PEDIDO puntual, no el expediente entero: el backend crea una
 * fila vacía (pregunta + plazo) cuando llega su fecha, y esa fila se completa cuando el
 * adoptante responde. Por eso el listado de una solicitud son varios pedidos con estados
 * distintos, y el POST responde uno solo.
 *
 * El `estado` no viaja en base, lo deriva el servidor contra su reloj: no recalcularlo en el
 * cliente, porque el plazo se mide contra la hora del servidor y no contra la del teléfono.
 */
import { adjuntarArchivo, get, postFormData } from './api';

/** Spec 011 §3. `PENDIENTE` es el único que acepta respuesta. */
export type EstadoSeguimiento = 'PENDIENTE' | 'VENCIDO' | 'COMPLETADO';

/** Desde qué lado mira el usuario: quien tiene la mascota, o quien la entregó. */
export type RolSeguimiento = 'ADOPTANTE' | 'PUBLICADOR';

/**
 * Sale de `Tipo_Solicitud.nombre`, pero el backend sólo pone en seguimiento las solicitudes
 * de adopción y de tránsito, así que ningún otro valor llega a estas pantallas.
 */
export type TipoSeguimiento = 'Adopcion' | 'Transito';

export interface MascotaSeguimiento {
  id: number;
  nombre: string | null;
  /** Ruta relativa: pasarla por `urlAbsoluta` antes de renderizarla. */
  imagenUrl: string | null;
}

export interface AdoptanteSeguimiento {
  id: number;
  nombre: string;
  apellido: string;
}

/** Un pedido de seguimiento: la pregunta que hizo el sistema y, si la hubo, la respuesta. */
export interface PedidoSeguimiento {
  id: number;
  /** 1-based, la posición dentro de la secuencia de esa solicitud. */
  numero: number;
  pregunta: string;
  estado: EstadoSeguimiento;
  /** `null` mientras el pedido no fue respondido. */
  descripcion: string | null;
  /** Ruta relativa a la foto de prueba de vida; `null` si todavía no respondió. */
  fotoUrl: string | null;
  /** ISO 8601. Cuándo llegó el pedido. */
  fechaPedido: string;
  /** ISO 8601. Hasta cuándo se puede responder (fechaPedido + 48 h). */
  plazo: string | null;
  /** ISO 8601. Cuándo lo respondió el adoptante; `null` si todavía no. */
  fechaRespuesta: string | null;
}

/** Fila del listado: una solicitud en seguimiento, resumida. */
export interface SolicitudEnSeguimiento {
  solicitudId: number;
  tipo: TipoSeguimiento;
  rol: RolSeguimiento;
  mascota: MascotaSeguimiento;
  adoptante: AdoptanteSeguimiento;
  totales: { completados: number; vencidos: number; pendientes: number };
  /** El pedido que se puede responder ahora, o `null` si no hay ninguno. */
  pendiente: { id: number; pregunta: string; plazo: string | null } | null;
  /** ISO 8601. Cuándo llega el próximo pedido, o `null` si la secuencia se agotó. */
  proximoAviso: string | null;
  finalizado: boolean;
}

/** GUI-21: el expediente completo de una solicitud. */
export interface DetalleSeguimiento {
  solicitudId: number;
  tipo: TipoSeguimiento;
  rol: RolSeguimiento;
  /** Ya combina rol y estado: `true` sólo si es el adoptante Y hay un pedido esperando. */
  puedeSubirActualizacion: boolean;
  mascota: MascotaSeguimiento;
  adoptante: AdoptanteSeguimiento;
  proximoAviso: string | null;
  finalizado: boolean;
  /** Del más reciente al más viejo — ya viene ordenado, no reordenar en el cliente. */
  seguimientos: PedidoSeguimiento[];
}

export interface ActualizacionCargada {
  /** Texto literal de HU-9.1: "seguimiento cargado con exito". */
  mensaje: string;
  seguimiento: PedidoSeguimiento;
}

/**
 * HU-9.3: una actualización puntual, con el contexto para abrirla suelta.
 *
 * Trae mascota, adoptante y solicitud porque la pantalla se puede abrir sin haber pasado por
 * el expediente (desde una notificación): si no, no tendría de dónde sacar de qué animal se
 * trata.
 */
export interface ActualizacionSeguimiento extends PedidoSeguimiento {
  solicitudId: number;
  tipo: TipoSeguimiento;
  rol: RolSeguimiento;
  mascota: MascotaSeguimiento;
  adoptante: AdoptanteSeguimiento;
  /**
   * Qué mostrar cuando NO hay actualización cargada, con las palabras literales de HU-9.3
   * ("Aún no se sube actualización de este seguimiento" si el plazo sigue abierto, "No se
   * subió actualización de seguimiento" si venció). Es `null` en una completada: ahí se
   * muestran `descripcion` y `fotoUrl`, que en los otros estados vienen siempre en `null`.
   *
   * El texto lo arma el servidor y se muestra tal cual: no reconstruirlo en el cliente.
   */
  mensaje: string | null;
}

/** La foto de prueba de vida, ya capturada con la cámara. */
export interface FotoPrueba {
  uri: string;
  nombre: string;
  tipo: string;
}

/** HU-9.2: todo lo que el usuario tiene en seguimiento, como adoptante y como publicador. */
export function listarMisSeguimientos(): Promise<SolicitudEnSeguimiento[]> {
  return get('/seguimientos');
}

/** HU-9.2: el historial de una solicitud puntual (GUI-21). */
export function obtenerSeguimientoDeSolicitud(solicitudId: number): Promise<DetalleSeguimiento> {
  return get(`/solicitudes/${solicitudId}/seguimientos`);
}

/**
 * HU-9.3: revisar una actualización puntual. `seguimientoId` es el id del PEDIDO.
 *
 * Es sólo lectura: abrirla no marca nada como visto ni cambia el estado del pedido.
 */
export function obtenerActualizacion(seguimientoId: number): Promise<ActualizacionSeguimiento> {
  return get(`/seguimientos/${seguimientoId}`);
}

/**
 * HU-9.1: responder un pedido con descripción y foto (GUI-22).
 *
 * `seguimientoId` es el id del PEDIDO, no el de la solicitud. La foto tiene que venir de la
 * cámara nativa (regla transversal 9): el backend no puede verificar su origen, así que esa
 * garantía la da el front al capturarla.
 */
export async function subirActualizacion(
  seguimientoId: number,
  datos: { descripcion: string; foto: FotoPrueba },
): Promise<ActualizacionCargada> {
  const formData = new FormData();
  formData.append('descripcion', datos.descripcion);
  await adjuntarArchivo(formData, 'foto', datos.foto);

  return postFormData(`/seguimientos/${seguimientoId}/actualizacion`, formData);
}
