import type { TipoReporte } from "@/types/admin-reportes";

export const TIPOS: Record<TipoReporte, string> = {
  PUBLICACION: "Publicación",
  USUARIO: "Persona",
  REFUGIO: "Refugio",
  RESENA: "Reseña",
  ANIMAL_PERDIDO: "Aviso de mascota perdida",
  CAMPANIA: "Campaña",
  MENSAJE: "Mensaje",
};
