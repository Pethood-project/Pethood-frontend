/**
 * Etiquetas legibles de los enums de Mascota, en un solo lugar. La tarjeta de swipe y la
 * ficha completa arman la misma línea "Edad · Tamaño · Sexo", así que el formato vive acá
 * y no duplicado en cada pantalla.
 */
import type { Genero, Tamanio } from '@/services/mascotas';
import { edadEnTexto, parsearFecha } from '@/shared/validation/dates';

/**
 * Único estado desde el que se puede solicitar adopción o tránsito (HU-7.1). Mismo nombre
 * que `ESTADO_SOLICITABLE` en `solicitudes.service.ts` del backend: si cambia allá, el botón
 * de acá tiene que cambiar junto.
 */
export const ESTADO_SOLICITABLE = 'Disponible';

const TAMANIOS: Record<Tamanio, string> = {
  PEQUENO: 'Pequeño',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
};

const GENEROS: Record<Genero, string> = {
  MACHO: 'Macho',
  HEMBRA: 'Hembra',
};

export function etiquetaTamanio(tamanio: Tamanio | null): string | null {
  return tamanio ? TAMANIOS[tamanio] : null;
}

export function etiquetaGenero(genero: Genero): string {
  return GENEROS[genero];
}

export function etiquetaEdad(fechaNacimiento: string | null): string | null {
  const fecha = parsearFecha(fechaNacimiento);
  return fecha ? edadEnTexto(fecha) : null;
}

/**
 * "2 años · Mediano · Macho". Los datos que falten se omiten en vez de mostrar un hueco:
 * `tamanio` y `fechaNacimiento` son opcionales en el modelo.
 */
export function resumenMascota(mascota: {
  fechaNacimiento: string | null;
  tamanio: Tamanio | null;
  genero: Genero;
}): string {
  return [
    etiquetaEdad(mascota.fechaNacimiento),
    etiquetaTamanio(mascota.tamanio),
    etiquetaGenero(mascota.genero),
  ]
    .filter(Boolean)
    .join(' · ');
}
