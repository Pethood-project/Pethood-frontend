export type RolUsuario = 'ADOPTANTE' | 'MIEMBRO_REFUGIO' | 'ADMIN';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  roles: RolUsuario[];
  imagenUrl?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
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
