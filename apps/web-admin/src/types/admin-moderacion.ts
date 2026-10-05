// Contrato: backend/docs/api-admin-moderacion.md
export interface Lista<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Duenio {
  tipo: "REFUGIO" | "ADOPTANTE";
  id: number;
  nombre: string;
}

export interface PublicacionAdmin {
  id: number;
  titulo: string;
  imagenUrl: string | null;
  estado: { id: number; nombre: string };
  mascota: { id: number; nombre: string; especie: string };
  publicador: Duenio;
  cantidadSolicitudes: number;
  cantidadReportes: number;
  fechaAlta: string;
  fechaBaja: string | null;
}

export type AccionPublicacion = "PAUSAR" | "REACTIVAR" | "FINALIZAR";

export interface MascotaAdmin {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  estado: { id: number; nombre: string };
  duenio: Duenio;
  tienePublicacionActiva: boolean;
  fechaAlta: string;
  fechaBaja: string | null;
}

export interface SolicitudAdmin {
  id: number;
  mascota: { id: number; nombre: string };
  solicitante: { id: number; nombre: string };
  refugio: { id: number; nombre: string } | null;
  tipo: string;
  estado: { id: number; nombre: string };
  fechaAlta: string;
}

export interface FiltrosModeracion {
  page?: number;
  limit?: number;
  q?: string;
  incluirBajas?: "true";
  tipo?: string;
  desde?: string;
  hasta?: string;
}

export interface ReportePublicacion {
  id: number;
  motivo: string;
  resuelto: boolean;
  respuesta: string | null;
  reportante: { id: number; nombre: string; apellido: string } | null;
  fechaAlta: string;
}

/** `GET /admin/publicaciones/:id` (docs/api-admin-moderacion.md). */
export interface DetallePublicacionAdmin extends PublicacionAdmin {
  descripcion: string | null;
  ubicacion: string | null;
  requisitos: string[];
  personalidad: string[];
  desparasitado: boolean;
  imagenes: string[];
  mascota: PublicacionAdmin["mascota"] & {
    fechaNacimiento: string | null;
    genero: string | null;
    tamanio: string | null;
    castrado: boolean | null;
    imagenUrl: string | null;
    raza: string;
  };
  reportes: ReportePublicacion[];
}

/** `GET /admin/mascotas/:id`. */
export interface DetalleMascotaAdmin extends MascotaAdmin {
  fechaNacimiento: string | null;
  genero: string | null;
  peso: number | null;
  tamanio: string | null;
  castrado: boolean | null;
  descripcion: string | null;
  imagenUrl: string | null;
  historiaClinica: {
    id: number;
    fechaVisita: string;
    titulo: string;
    descripcion: string | null;
    vacunacion: boolean;
    tipoVacuna: string | null;
    documentoUrl: string | null;
  }[];
}

/** `GET /admin/solicitudes/:id`. */
export interface DetalleSolicitudAdmin extends SolicitudAdmin {
  publicacionId: number;
  motivacion: string | null;
  comentario: string | null;
  fechaRespuesta: string | null;
  fechaInicioTransito: string | null;
  fechaFinTransito: string | null;
  fechaBaja: string | null;
  historialEstados: { estado: string; fechaAlta: string; fechaBaja: string | null; usuarioAlta: unknown }[];
}
