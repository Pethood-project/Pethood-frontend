// Contrato: pethood-backend/docs/specs/008-moderacion-reportes.md §4.
export type TipoReporte =
  | "PUBLICACION"
  | "USUARIO"
  | "REFUGIO"
  | "RESENA"
  | "ANIMAL_PERDIDO"
  | "CAMPANIA"
  | "MENSAJE";

export type EstadoReporte = "pendiente" | "resuelto" | "todos";
export type EstadoObjeto = "ACTIVO" | "SUSPENDIDO" | "DE_BAJA";

export interface PersonaReporte {
  id: number;
  nombre: string;
  apellido: string;
}

export interface ReporteAdmin {
  id: number;
  tipo: TipoReporte;
  motivo: string;
  resuelto: boolean;
  reportante: PersonaReporte | null;
  /**
   * `etiqueta` null si el objeto ya no se puede resolver. `imagenUrl` es la miniatura (null en
   * reseña y mensaje). Los contadores son de reportes del MISMO objeto, para ver reincidentes.
   */
  objeto: {
    id: number;
    etiqueta: string | null;
    imagenUrl: string | null;
    reportesPendientes: number;
    reportesTotales: number;
  };
  fechaAlta: string;
}

/** Un mensaje de la ventana de contexto de un reporte de tipo MENSAJE (±10 del reportado). */
export interface MensajeContexto {
  id: number;
  contenido: string;
  imagenes: string[];
  fechaAlta: string;
  usuario: PersonaReporte;
}

type PersonaRef = { id: number; nombre: string; apellido: string };

/** `objeto.vista` de `GET /admin/reportes/:id` (spec 008 §4). Solo USUARIO, RESENA, ANIMAL_PERDIDO y CAMPANIA; el resto viene `undefined`. */
export type VistaObjetoReporte =
  | { tipo: "USUARIO"; nombre: string; apellido: string; email: string; telefono: string | null; imagenUrl: string | null; verificado: boolean; estado: string; fechaAlta: string; provincia: string | null; localidad: string | null; refugios: { id: number; nombre: string }[] }
  | { tipo: "RESENA"; puntuacion: number; comentario: string | null; fecha: string; autor: PersonaRef; receptor: { tipo: "REFUGIO" | "PERSONA"; id: number; nombre: string } }
  | { tipo: "ANIMAL_PERDIDO"; nombre: string | null; estado: string; descripcion: string; imagenes: string[]; ubicacion: string | null; fechaSuceso: string; reportante: PersonaRef }
  | { tipo: "CAMPANIA"; titulo: string; descripcion: string; estado: string; montoObjetivo: number; montoActual: number; fechaInicio: string; fechaFin: string; imagenes: string[]; refugio: { id: number; nombre: string } };

export interface DetalleReporte extends ReporteAdmin {
  respuesta: string | null;
  fechaResolucion: string | null;
  resueltoPor: PersonaReporte | null;
  objeto: ReporteAdmin["objeto"] & {
    estado: EstadoObjeto | null;
    vista?: VistaObjetoReporte;
    /** Solo en MENSAJE. El reportado es el de `id` igual a `objeto.id`. */
    contexto?: MensajeContexto[];
  };
}

export interface FiltrosReportes {
  estado?: EstadoReporte;
  tipo?: TipoReporte;
  page?: number;
  limit?: number;
}

export interface ListaReportes {
  items: ReporteAdmin[];
  total: number;
  page: number;
  limit: number;
}
