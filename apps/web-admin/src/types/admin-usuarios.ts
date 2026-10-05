import type { RolUsuario } from "@/types/auth";
import type { EstadoCiclo } from "@/components/ui/EstadoBadge";

// Contrato: apps/web-admin/API.ADMIN.md "Gestión de Usuarios" / "Gestión de Refugios"
// + spec 002 (pethood-backend/docs/specs/002-admin-usuarios-refugios.md).

export type EstadoUsuario = EstadoCiclo;
export type EstadoRefugio = EstadoCiclo;

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  dni: string | null;
  telefono: string | null;
  verificado: boolean;
  estado: EstadoUsuario;
  roles: RolUsuario[];
  refugioId: number | null;
}

export interface ListaUsuarios {
  total: number;
  page: number;
  limit: number;
  usuarios: UsuarioAdmin[];
}

export interface FiltrosUsuarios {
  page?: number;
  limit?: number;
  q?: string;
  rol?: RolUsuario;
  estado?: EstadoUsuario;
  verificado?: "true" | "false";
}

export interface RefugioAdmin {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  descripcion: string | null;
  verificado: boolean;
  estado: EstadoRefugio;
  imagenUrl: string | null;
}

export interface ListaRefugios {
  total: number;
  page: number;
  limit: number;
  refugios: RefugioAdmin[];
}

export interface FiltrosRefugios {
  page?: number;
  limit?: number;
  q?: string;
  verificado?: "true" | "false";
  estado?: EstadoRefugio;
}

export interface MiembroRefugio {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  roles: RolUsuario[];
}

export interface ResumenRefugio {
  mascotasActivas: number;
  publicacionesActivas: number;
  solicitudesPendientes: number;
  campaniasActivas: number;
  resenasRecibidas: number;
  promedioResenas: number;
}

export interface DetalleRefugio {
  refugio: RefugioAdmin;
  miembros: MiembroRefugio[];
  resumen: ResumenRefugio;
  resenas: ResumenResenas;
}

export interface AltaRefugioBody {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  descripcion?: string;
}

export interface RolesBody {
  agregar?: RolUsuario[];
  quitar?: RolUsuario[];
  refugioId?: number;
}

// --- Reseñas (mismo resumen que el perfil público) ----------------------------------------

export interface ResenaAdmin {
  id: number;
  puntuacion: number;
  comentario: string | null;
  fecha: string;
  autor: { id: number; nombre: string; apellido: string; imagenUrl: string | null };
}

export interface ResumenResenas {
  promedio: number | null;
  cantidad: number;
  distribucion: { puntuacion: number; cantidad: number }[];
  resenas: ResenaAdmin[];
}

/** `GET /admin/usuarios/:id`. */
export interface DetalleUsuario {
  usuario: UsuarioAdmin & {
    imagenUrl: string | null;
    fechaNacimiento: string | null;
    fechaAlta: string;
    ubicacion: string | null;
    refugio: { id: number; nombre: string } | null;
  };
  resumen: { mascotas: number; solicitudes: number; donaciones: number };
  resenas: ResumenResenas;
}
