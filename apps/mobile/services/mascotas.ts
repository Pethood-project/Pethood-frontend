import { adjuntarArchivo, del, get, patchFormData, postFormData } from './api';

export type Tamanio = 'PEQUENO' | 'MEDIANO' | 'GRANDE';
export type Genero = 'MACHO' | 'HEMBRA';
export type Destino = 'PROPIA' | 'ADOPCION';

export interface Mascota {
  id: number;
  nombre: string | null;
  fechaNacimiento: string | null;
  genero: Genero;
  peso: number | null;
  tamanio: Tamanio | null;
  castrado: boolean;
  descripcion: string | null;
  imagenUrl: string | null;
  especie: { id: number; nombre: string };
  raza: { id: number; nombre: string };
  estado: { id: number; nombre: string };
  refugioId: number | null;
  usuarioId: number;
  habilitaPublicacion: boolean;
}

export interface DatosNuevaMascota {
  nombre: string;
  fechaNacimiento: string;
  genero: Genero;
  peso: string;
  tamanio: Tamanio;
  especieId: number;
  razaId: number;
  castrado: boolean;
  descripcion: string;
  /** Solo el adoptante lo manda: indica si la mascota es propia o para adopción. */
  destino?: Destino;
  /** Solo el refugio lo manda. */
  estadoMascotaId?: number;
  foto: { uri: string; nombre: string; tipo: string };
}

export async function crearMascota(datos: DatosNuevaMascota): Promise<Mascota> {
  const formData = new FormData();

  formData.append('nombre', datos.nombre);
  formData.append('fechaNacimiento', datos.fechaNacimiento);
  formData.append('genero', datos.genero);
  formData.append('peso', datos.peso);
  formData.append('tamanio', datos.tamanio);
  formData.append('especieId', String(datos.especieId));
  formData.append('razaId', String(datos.razaId));
  formData.append('castrado', String(datos.castrado));
  formData.append('descripcion', datos.descripcion);

  if (datos.destino) formData.append('destino', datos.destino);
  if (datos.estadoMascotaId) formData.append('estadoMascotaId', String(datos.estadoMascotaId));

  await adjuntarArchivo(formData, 'foto', datos.foto);

  return postFormData('/mascotas', formData);
}

/**
 * Quien pertenece a un refugio tiene dos conjuntos separados: las mascotas que cargó como
 * persona y las del refugio, que son de todos sus miembros. El backend devuelve el del
 * perfil activo (cabecera `X-Ambito`, ver `services/sesion.ts`).
 */
export function listarMisMascotas(): Promise<Mascota[]> {
  return get('/mascotas/mias');
}

export interface FichaMascota extends Mascota {
  /** Id de la publicación activa de esta mascota, o `null` si no está publicada. */
  publicacionActivaId: number | null;
}

/**
 * Ficha individual (HU-6.4). El backend la muestra solo si es del perfil activo: una
 * personal propia desde la vista personal, cualquiera del refugio desde la de refugio; si
 * no, devuelve 404, que la pantalla traduce a su mensaje.
 */
export function obtenerMascota(id: number): Promise<FichaMascota> {
  return get(`/mascotas/${id}`);
}

/**
 * El formulario de edición precarga por acá en vez de `obtenerMascota`: sale del mismo
 * listado del perfil activo, así que una mascota del otro perfil da `null`.
 */
export async function obtenerMiMascota(id: number): Promise<Mascota | null> {
  const mascotas = await listarMisMascotas();
  return mascotas.find((mascota) => mascota.id === id) ?? null;
}

/**
 * Campos a modificar (HU-6.2). Un campo `undefined` NO viaja y el backend lo deja como
 * está; solo se manda lo que cambió.
 *
 * Dos trampas del contrato:
 * - `castrado` en `false` y `castrado` ausente dan resultados distintos, así que la
 *   pantalla lo manda siempre, haya cambiado o no.
 * - `especieId` y `razaId` viajan de a dos o no viajan: uno solo es un 400.
 */
export interface CambiosMascota {
  nombre?: string;
  fechaNacimiento?: string;
  genero?: Genero;
  peso?: string;
  tamanio?: Tamanio;
  especieId?: number;
  razaId?: number;
  castrado?: boolean;
  /** Una cadena vacía borra la descripción; `undefined` la deja intacta. */
  descripcion?: string;
  foto?: { uri: string; nombre: string; tipo: string };
}

export async function editarMascota(id: number, cambios: CambiosMascota): Promise<Mascota> {
  const formData = new FormData();

  // Se compara contra undefined y no por truthiness: `castrado: false` y `descripcion: ''`
  // son cambios reales que tienen que viajar.
  if (cambios.nombre !== undefined) formData.append('nombre', cambios.nombre);
  if (cambios.fechaNacimiento !== undefined) {
    formData.append('fechaNacimiento', cambios.fechaNacimiento);
  }
  if (cambios.genero !== undefined) formData.append('genero', cambios.genero);
  if (cambios.peso !== undefined) formData.append('peso', cambios.peso);
  if (cambios.tamanio !== undefined) formData.append('tamanio', cambios.tamanio);
  if (cambios.especieId !== undefined) formData.append('especieId', String(cambios.especieId));
  if (cambios.razaId !== undefined) formData.append('razaId', String(cambios.razaId));
  if (cambios.castrado !== undefined) formData.append('castrado', String(cambios.castrado));
  if (cambios.descripcion !== undefined) formData.append('descripcion', cambios.descripcion);

  if (cambios.foto) {
    await adjuntarArchivo(formData, 'foto', cambios.foto);
  }

  return patchFormData(`/mascotas/${id}`, formData);
}

export interface ResultadoEliminacion {
  id: number;
  /** Si es mayor a 0, la baja también retiró la publicación en adopción. */
  publicacionesDadasDeBaja: number;
}

/** Baja lógica (HU-6.3): la mascota deja de aparecer en los listados. */
export function eliminarMascota(id: number): Promise<ResultadoEliminacion> {
  return del(`/mascotas/${id}`);
}

export interface DatosNuevaPublicacion {
  mascotaId: number;
  descripcion: string;
  ubicacion: string;
  requisitos: string[];
  personalidad: string[];
  desparasitado: boolean;
  vacunas: string;
  /** En orden: la primera es la portada. Si va vacío se usa la foto de la mascota. */
  fotos: { uri: string; nombre: string; tipo: string }[];
}

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  requisitos: string[];
  personalidad: string[];
  desparasitado: boolean;
  vacunas: string | null;
  imagenes: string[];
  mascotaId: number;
  usuarioId: number;
}

export async function crearPublicacion(datos: DatosNuevaPublicacion): Promise<Publicacion> {
  const formData = new FormData();

  formData.append('mascotaId', String(datos.mascotaId));
  formData.append('descripcion', datos.descripcion);
  formData.append('ubicacion', datos.ubicacion);
  formData.append('desparasitado', String(datos.desparasitado));
  formData.append('vacunas', datos.vacunas);

  // Repetir la clave es como viaja una lista en multipart.
  for (const requisito of datos.requisitos) formData.append('requisitos', requisito);
  for (const rasgo of datos.personalidad) formData.append('personalidad', rasgo);

  for (const foto of datos.fotos) {
    await adjuntarArchivo(formData, 'fotos', foto);
  }

  return postFormData('/publicaciones', formData);
}
