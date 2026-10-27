/**
 * Cómo se ve cada notificación en la bandeja: su título corto, su ícono, su color y a qué
 * grupo pertenece, más el agrupado por día. El backend manda el `tipo` y el mensaje; lo
 * visual se decide acá, igual que con los estados.
 *
 * Los tipos son los de `TITULOS_PUSH` del backend. Uno desconocido cae en un estilo genérico
 * en vez de romper la fila.
 */
import type { Ionicons } from '@expo/vector-icons';

import { PALETA } from '@/constants/theme';
import type { NotificacionItem } from '@/services/notificaciones';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** Los grupos que se pueden filtrar; lo demás aparece solo en "Todas". */
export type CategoriaNotificacion = 'solicitudes' | 'mascotas' | 'otras';

export interface TonoNotificacion {
  fondo: string;
  tinta: string;
}

const TONOS = {
  acento: { fondo: PALETA.accent[100], tinta: PALETA.accent[600] },
  amarillo: { fondo: PALETA.calido.amarilloClaro, tinta: PALETA.accent[800] },
  exito: { fondo: PALETA.estado.exitoSuave, tinta: PALETA.estado.exitoTinta },
  neutro: { fondo: PALETA.neutral[200], tinta: PALETA.neutral[600] },
  alerta: { fondo: PALETA.accent[100], tinta: PALETA.estado.error },
} satisfies Record<string, TonoNotificacion>;

export interface EstiloNotificacion {
  titulo: string;
  icono: NombreIcono;
  tono: TonoNotificacion;
  categoria: CategoriaNotificacion;
}

const ESTILOS: Record<string, EstiloNotificacion> = {
  // Solicitudes
  SOLICITUD_NUEVA: {
    titulo: 'Nueva solicitud',
    icono: 'document-text',
    tono: TONOS.acento,
    categoria: 'solicitudes',
  },
  SOLICITUD_ACEPTADA: {
    titulo: 'Solicitud aceptada',
    icono: 'checkmark-circle',
    tono: TONOS.exito,
    categoria: 'solicitudes',
  },
  SOLICITUD_RECHAZADA: {
    titulo: 'Novedades de tu solicitud',
    icono: 'heart-outline',
    tono: TONOS.neutro,
    categoria: 'solicitudes',
  },
  SOLICITUD_REVISADA: {
    titulo: 'Solicitud revisada',
    icono: 'eye',
    tono: TONOS.amarillo,
    categoria: 'solicitudes',
  },
  SOLICITUD_CERRADA: {
    titulo: 'Solicitud cerrada',
    icono: 'lock-closed',
    tono: TONOS.neutro,
    categoria: 'solicitudes',
  },
  SOLICITUD_RETIRADA: {
    titulo: 'Solicitud retirada',
    icono: 'arrow-undo',
    tono: TONOS.neutro,
    categoria: 'solicitudes',
  },
  SOLICITUD_REVISADA_SIN_DECISION: {
    titulo: 'Esperando tu decisión',
    icono: 'hourglass',
    tono: TONOS.amarillo,
    categoria: 'solicitudes',
  },
  SOLICITUD_MASCOTA_ADOPTADA_POR_OTRO: {
    titulo: 'Novedades de tu solicitud',
    icono: 'paw',
    tono: TONOS.neutro,
    categoria: 'solicitudes',
  },
  PUBLICACION_PAUSADA_CON_SOLICITUD: {
    titulo: 'Publicación en pausa',
    icono: 'pause-circle',
    tono: TONOS.amarillo,
    categoria: 'solicitudes',
  },
  ADOPCION_COMPLETADA: {
    titulo: 'Adopción completada',
    icono: 'heart',
    tono: TONOS.exito,
    categoria: 'solicitudes',
  },
  TRANSITO_POR_COMENZAR: {
    titulo: 'Tránsito por comenzar',
    icono: 'calendar',
    tono: TONOS.amarillo,
    categoria: 'solicitudes',
  },
  TRANSITO_POR_VENCER: {
    titulo: 'Tránsito por terminar',
    icono: 'calendar',
    tono: TONOS.amarillo,
    categoria: 'solicitudes',
  },

  // Mascotas
  FAVORITO_DISPONIBLE: {
    titulo: 'Volvió a estar disponible',
    icono: 'heart',
    tono: TONOS.acento,
    categoria: 'mascotas',
  },
  FAVORITO_NO_DISPONIBLE: {
    titulo: 'Favorito no disponible',
    icono: 'heart-dislike',
    tono: TONOS.neutro,
    categoria: 'mascotas',
  },
  FAVORITO_ADOPTADO: {
    titulo: 'Mascota adoptada',
    icono: 'home',
    tono: TONOS.exito,
    categoria: 'mascotas',
  },
  FAVORITO_FALLECIDO: {
    titulo: 'Mascota en tus favoritos',
    icono: 'heart-outline',
    tono: TONOS.neutro,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_NUEVO: {
    titulo: 'Seguimiento nuevo',
    icono: 'footsteps',
    tono: TONOS.acento,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_RECORDATORIO_24H: {
    titulo: 'Seguimiento por vencer',
    icono: 'time',
    tono: TONOS.amarillo,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_VENCIDO: {
    titulo: 'Seguimiento vencido',
    icono: 'alert-circle',
    tono: TONOS.alerta,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_DESCUIDO: {
    titulo: 'Seguimiento sin enviar',
    icono: 'alert-circle',
    tono: TONOS.alerta,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_PREGUNTA_REFUGIO: {
    titulo: 'Pregunta del refugio',
    icono: 'chatbubble-ellipses',
    tono: TONOS.acento,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_RESPONDIDO: {
    titulo: 'Seguimiento recibido',
    icono: 'checkmark-done',
    tono: TONOS.exito,
    categoria: 'mascotas',
  },
  SEGUIMIENTO_TERMINADO: {
    titulo: 'Seguimiento terminado',
    icono: 'flag',
    tono: TONOS.exito,
    categoria: 'mascotas',
  },
  ANIMAL_PERDIDO_RECLAMADO: {
    titulo: 'Alguien se contactó',
    icono: 'search',
    tono: TONOS.acento,
    categoria: 'mascotas',
  },
  MODERACION_BAJA_MASCOTA: {
    titulo: 'Mascota dada de baja',
    icono: 'flag',
    tono: TONOS.alerta,
    categoria: 'mascotas',
  },

  // Otras
  MENSAJE_CHAT: {
    titulo: 'Nuevo mensaje',
    icono: 'chatbubble',
    tono: TONOS.acento,
    categoria: 'otras',
  },
  RESENA_RECIBIDA: {
    titulo: 'Nueva reseña',
    icono: 'star',
    tono: TONOS.amarillo,
    categoria: 'otras',
  },
  DONACION_NUEVA: {
    titulo: 'Donación por confirmar',
    icono: 'heart-circle',
    tono: TONOS.amarillo,
    categoria: 'otras',
  },
  DONACION_CONFIRMADA: {
    titulo: 'Donación confirmada',
    icono: 'heart-circle',
    tono: TONOS.exito,
    categoria: 'otras',
  },
  DONACION_RECHAZADA: {
    titulo: 'Donación no confirmada',
    icono: 'heart-circle',
    tono: TONOS.neutro,
    categoria: 'otras',
  },
  CAMPANIA_META_ALCANZADA: {
    titulo: 'Campaña completa',
    icono: 'trophy',
    tono: TONOS.exito,
    categoria: 'otras',
  },
  CAMPANIA_FINALIZADA: {
    titulo: 'Campaña finalizada',
    icono: 'megaphone',
    tono: TONOS.neutro,
    categoria: 'otras',
  },
  USUARIO_VALIDADO: {
    titulo: 'Cuenta validada',
    icono: 'shield-checkmark',
    tono: TONOS.exito,
    categoria: 'otras',
  },
  VERIFICACION_REVOCADA: {
    titulo: 'Verificación revocada',
    icono: 'shield',
    tono: TONOS.alerta,
    categoria: 'otras',
  },
  CUENTA_SUSPENDIDA: {
    titulo: 'Cuenta suspendida',
    icono: 'ban',
    tono: TONOS.alerta,
    categoria: 'otras',
  },
  REFUGIO_APROBADO: {
    titulo: 'Refugio validado',
    icono: 'business',
    tono: TONOS.exito,
    categoria: 'otras',
  },
  REFUGIO_SUSPENDIDO: {
    titulo: 'Refugio suspendido',
    icono: 'business',
    tono: TONOS.alerta,
    categoria: 'otras',
  },
  CONTRASENA_CAMBIADA: {
    titulo: 'Contraseña cambiada',
    icono: 'key',
    tono: TONOS.neutro,
    categoria: 'otras',
  },
  PERFIL_INCOMPLETO: {
    titulo: 'Completá tu perfil',
    icono: 'person-circle',
    tono: TONOS.amarillo,
    categoria: 'otras',
  },
  REPORTE_RESUELTO: {
    titulo: 'Reporte resuelto',
    icono: 'flag',
    tono: TONOS.neutro,
    categoria: 'otras',
  },
  REPORTE_NUEVO: {
    titulo: 'Nuevo reporte',
    icono: 'flag',
    tono: TONOS.amarillo,
    categoria: 'otras',
  },
  MODERACION_BAJA: {
    titulo: 'Publicación dada de baja',
    icono: 'flag',
    tono: TONOS.alerta,
    categoria: 'otras',
  },
};

const ESTILO_GENERICO: EstiloNotificacion = {
  titulo: 'Novedad',
  icono: 'notifications',
  tono: TONOS.acento,
  categoria: 'otras',
};

export function estiloDeNotificacion(tipo: string): EstiloNotificacion {
  return ESTILOS[tipo] ?? ESTILO_GENERICO;
}

export type FiltroNotificaciones = 'todas' | 'sinLeer' | CategoriaNotificacion;

/** Las que se ofrecen como pastillas: "otras" no, porque no tiene un nombre que decir. */
export const OPCIONES_FILTRO: { valor: FiltroNotificaciones; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'sinLeer', etiqueta: 'Sin leer' },
  { valor: 'solicitudes', etiqueta: 'Solicitudes' },
  { valor: 'mascotas', etiqueta: 'Mascotas' },
];

export function cumpleFiltro(item: NotificacionItem, filtro: FiltroNotificaciones): boolean {
  if (filtro === 'todas') return true;
  if (filtro === 'sinLeer') return !item.leido;
  return estiloDeNotificacion(item.tipo).categoria === filtro;
}

/** Una cabecera de día o una notificación, en el orden en que se dibujan. */
export type FilaBandeja =
  | { tipo: 'cabecera'; clave: string; etiqueta: string }
  | { tipo: 'item'; clave: string; item: NotificacionItem };

function inicioDelDia(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** "Hoy", "Ayer", "Esta semana" o "Antes": lo más cercano en el tiempo, con nombre propio. */
function grupoDeDia(fecha: Date, ahora: Date): string {
  const dias = Math.round((inicioDelDia(ahora) - inicioDelDia(fecha)) / MS_POR_DIA);

  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 7) return 'Esta semana';
  return 'Antes';
}

/**
 * Intercala una cabecera cada vez que cambia el grupo. Espera la lista de la más nueva a la más
 * vieja, que es como la manda el backend.
 */
export function agruparPorDia(items: NotificacionItem[], ahora: Date = new Date()): FilaBandeja[] {
  const filas: FilaBandeja[] = [];
  let anterior: string | null = null;

  for (const item of items) {
    const grupo = grupoDeDia(new Date(item.fechaAlta), ahora);

    if (grupo !== anterior) {
      filas.push({ tipo: 'cabecera', clave: `grupo-${grupo}`, etiqueta: grupo });
      anterior = grupo;
    }

    filas.push({ tipo: 'item', clave: `n-${item.id}`, item });
  }

  return filas;
}
