// Listados del panel del refugio. Son los mismos endpoints que usa la app móvil en la vista
// de refugio: el back scopea por el refugio del JWT (sin cabecera X-Ambito, un miembro de
// refugio queda en REFUGIO — spec 016).
import type { ResumenResenas } from "./admin-usuarios";

export interface Catalogo {
  id: number;
  nombre: string;
}

/** `GET /mascotas/mias`. */
export interface MascotaRefugio {
  id: number;
  nombre: string | null;
  fechaNacimiento: string | null;
  genero: string;
  tamanio: string | null;
  castrado: boolean;
  imagenUrl: string | null;
  especie: Catalogo;
  raza: Catalogo;
  estado: Catalogo;
  habilitaPublicacion: boolean;
}

/** `GET /publicaciones/mias`. */
export interface PublicacionRefugio {
  id: number;
  titulo: string;
  cantidadSolicitudes: number;
  imagenUrl: string | null;
  fechaPublicacion: string;
  estado: Catalogo;
  mascota: { id: number; nombre: string | null; fechaNacimiento: string | null; especie: Catalogo };
}

/** Nombres del catálogo Estado_Solicitud, tal como los acepta `?estados=`. */
export const ESTADOS_SOLICITUD = [
  "Pendiente",
  "En_Revision",
  "Revisada",
  "Aprobada",
  "Rechazada",
  "Cancelada",
  "Cerrada",
] as const;

/** Las que siguen esperando una decisión del refugio. */
export const ESTADOS_SOLICITUD_ABIERTA = ["Pendiente", "En_Revision", "Revisada"] as const;

export interface SolicitudRecibida {
  id: number;
  publicacionId: number;
  mascota: { id: number; nombre: string | null; imagenUrl: string | null };
  solicitante: { id: number; nombre: string; apellido: string };
  tipoSolicitud: string;
  estado: Catalogo;
  comentario: string | null;
  fechaAlta: string;
  fechaRespuesta: string | null;
}

/** `GET /solicitudes/recibidas` — paginado por offset (anterior al estándar de cursor). */
export interface ListaSolicitudesRecibidas {
  total: number;
  solicitudes: SolicitudRecibida[];
}

export interface FiltrosSolicitudesRecibidas {
  page: number;
  /** Nombre del catálogo, `todas` o `demoradas` (alerta del dashboard). */
  estado: string;
}

/** Acciones manuales sobre una publicación (`PATCH /publicaciones/:id/estado`). */
export type AccionPublicacion = "PAUSAR" | "REACTIVAR" | "FINALIZAR";

/** Resolución de una solicitud abierta (`PATCH /solicitudes/:id/estado`). */
export type ResolucionSolicitud = "Aprobada" | "Rechazada";

/** Por qué se rechaza: es obligatorio al rechazar y se le dice a la persona con tacto. */
export const MOTIVOS_RECHAZO = [
  { valor: "NO_CUMPLE_REQUISITOS", etiqueta: "No cumple los requisitos" },
  { valor: "MASCOTA_CON_HOGAR", etiqueta: "La mascota ya tiene hogar" },
  { valor: "SIN_CONTACTO", etiqueta: "No pudimos contactarla" },
  { valor: "OTRO", etiqueta: "Otro" },
] as const;

export type MotivoRechazo = (typeof MOTIVOS_RECHAZO)[number]["valor"];

/** Estados a los que el refugio lleva una campaña a mano (`PATCH /refugio/campanias/:id/estado`). */
export type EstadoManualCampania = "Pausada" | "Activa" | "Finalizada";

/** `GET /refugio/campanias`. */
export interface CampaniaRefugio {
  id: number;
  titulo: string;
  imagenUrl: string | null;
  objetivo: number;
  recaudado: number;
  porcentaje: number;
  donantes: number;
  fechaInicio: string;
  fechaFin: string;
  estado: Catalogo;
  pendientes: number;
  confirmacionAutomatica: boolean;
}

export interface ListaCampaniasRefugio {
  campanias: CampaniaRefugio[];
  hayMas: boolean;
  proximoCursor: number | null;
}

/** `GET /refugio/perfil`: los datos propios del refugio, con contacto y estadísticas. */
export interface PerfilRefugio {
  id: number;
  nombre: string;
  provincia: string | null;
  localidad: string | null;
  calleAltura: string | null;
  mapaUrl: string | null;
  /** Si el refugio confirmó en la app que el link de Maps apunta a su dirección real. */
  ubicacionVerificada: boolean;
  telefono: string | null;
  email: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  verificado: boolean;
  estadisticas: { enRefugio: number; adopciones: number; solicitudesAbiertas: number };
}

/** `GET /refugios/:id`: lo que ven los adoptantes (GUI-26). */
export interface PerfilPublicoRefugio {
  id: number;
  fechaAlta: string;
  resumen: { publicacionesActivas: number; resenas: { promedio: number | null; cantidad: number } };
}

export type { ResumenResenas };
