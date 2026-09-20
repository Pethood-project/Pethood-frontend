export type RolUsuario = 'ADOPTANTE' | 'MIEMBRO_REFUGIO' | 'ADMIN';

/** El refugio en el que trabaja la persona. `null` en un adoptante. */
export interface RefugioDeSesion {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  roles: RolUsuario[];
  imagenUrl?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  /**
   * Refugio al que pertenece, o `null`. Lo necesita GUI-31 para nombrarlo en la cabecera
   * del listado de chats. Opcional porque una sesión guardada antes de que el backend lo
   * mandara no lo tiene.
   */
  refugio?: RefugioDeSesion | null;
}

export interface Perfil extends Usuario {
  telefono: string | null;
  ubicacion: string | null;
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
}

export interface ActualizarPerfilPayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  ubicacion: string;
}
