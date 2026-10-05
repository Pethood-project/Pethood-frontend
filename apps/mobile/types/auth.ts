export type RolUsuario = 'ADOPTANTE' | 'MIEMBRO_REFUGIO' | 'ADMIN';

/** El refugio en el que trabaja la persona. `null` en un adoptante. */
export interface RefugioDeSesion {
  id: number;
  nombre: string;
  /**
   * Activo, Pendiente_Verificacion, Suspendido o Inactivo. Solo con Activo el backend deja
   * usar el perfil de refugio (si no, 403 REFUGIO_NO_VERIFICADO). Opcional por si la sesión
   * guardada en el dispositivo es de una versión anterior.
   */
  estado?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  roles: RolUsuario[];
  imagenUrl?: string | null;
  telefono?: string | null;
  /** Dirección estructurada del perfil (para geocodificar). */
  provincia?: string | null;
  localidad?: string | null;
  calleAltura?: string | null;
  /** URL de Google Maps y coordenadas geocodificadas de la dirección. */
  mapaUrl?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  /** Si el usuario confirmó que el link de Maps apunta a su dirección real. */
  ubicacionVerificada?: boolean;
  /**
   * Refugio al que pertenece, o `null`. Lo necesita GUI-31 para nombrarlo en la cabecera
   * del listado de chats. Opcional porque una sesión guardada antes de que el backend lo
   * mandara no lo tiene.
   */
  refugio?: RefugioDeSesion | null;
}

export interface Perfil extends Usuario {
  telefono: string | null;
  provincia: string | null;
  localidad: string | null;
  calleAltura: string | null;
  mapaUrl: string | null;
  latitud: number | null;
  longitud: number | null;
  ubicacionVerificada: boolean;
  imagenUrl: string | null;
  tienePassword: boolean;
  mascotas: number;
  favoritos: number;
  valoracion: number | null;
}

export interface RespuestaPerfil {
  usuario: Perfil;
}

export interface RespuestaAuth {
  usuario: Usuario;
  token: string;
}

export interface RespuestaRecuperar {
  mensaje: string;
  codigo?: string;
}

export interface RegistroPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  fechaNacimiento: string;
  telefono: string;
  /** Dirección opcional; si vienen las tres, el backend geocodifica y guarda coordenadas. */
  provincia?: string;
  localidad?: string;
  calleAltura?: string;
}

export interface ActualizarPerfilPayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  provincia: string;
  localidad: string;
  calleAltura: string;
  ubicacionVerificada: boolean;
}

/** Resultado del preview de geocodificación (sin guardar). */
export interface UbicacionPreview {
  mapaUrl: string;
  latitud: number;
  longitud: number;
}
