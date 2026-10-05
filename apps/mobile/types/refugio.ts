/**
 * Perfil propio del refugio (spec 017 del backend): lo que ve un miembro desde la vista de
 * refugio, en lugar de sus datos personales.
 */
export interface PerfilRefugio {
  id: number;
  nombre: string;
  /** Dirección estructurada del refugio (para geocodificar). */
  provincia: string | null;
  localidad: string | null;
  calleAltura: string | null;
  /** Link de Google Maps del refugio (se muestra en Mi Refugio y en la ficha de la mascota). */
  mapaUrl: string | null;
  latitud: number | null;
  longitud: number | null;
  /** Si el refugio confirmó que el link de Maps apunta a su dirección real. */
  ubicacionVerificada: boolean;
  telefono: string | null;
  email: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  verificado: boolean;
  estado: string;
  estadisticas: {
    /** Disponibles, en tratamiento o en tránsito: las que siguen en el refugio. */
    enRefugio: number;
    adopciones: number;
    /** Pendientes o en revisión: las que esperan una respuesta del refugio. */
    solicitudesAbiertas: number;
  };
  valoracion: { promedio: number | null; cantidad: number };
  /**
   * Si quien mira puede editar los datos. Hoy siempre `true` (cualquier miembro edita); el
   * permiso por rol dentro del refugio está pendiente en DEUDA_TECNICA.md.
   */
  puedeEditar: boolean;
}

export interface RespuestaPerfilRefugio {
  refugio: PerfilRefugio;
}

/** Viajan todos siempre: un opcional vacío es un dato que se borra. */
export interface ActualizarPerfilRefugioPayload {
  nombre: string;
  provincia: string;
  localidad: string;
  calleAltura: string;
  telefono: string;
  email: string;
  descripcion: string;
  ubicacionVerificada: boolean;
}
