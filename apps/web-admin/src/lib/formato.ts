// Formateo para server components. `components/admin/Detalle.tsx` tiene helpers parecidos,
// pero es "use client": sus funciones no se pueden llamar desde el server.

export const dia = (iso: string) => new Date(iso).toLocaleDateString("es-AR");

/** Fechas `AAAA-MM-DD` sin hora: se parsean como locales para que no corran un día por el huso. */
export function diaSinHora(fecha: string): string {
  const [anio, mes, d] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, d).toLocaleDateString("es-AR");
}

export const plata = (n: number | string) =>
  Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const ETIQUETAS_ESTADO: Record<string, string> = {
  En_Revision: "En revisión",
  Cerrada: "Cerrada",
  Adopcion: "Adopción",
  Transito: "Tránsito",
};

/** Nombre de catálogo o enum (`En_Tratamiento`, `HEMBRA`) a texto de pantalla (`En tratamiento`, `Hembra`). */
export function etiquetaEstado(nombre: string): string {
  if (ETIQUETAS_ESTADO[nombre]) return ETIQUETAS_ESTADO[nombre];
  const texto = nombre.replace(/_/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function diasDesde(iso: string, hoy = new Date()): number {
  return Math.max(0, Math.floor((hoy.getTime() - new Date(iso).getTime()) / 86_400_000));
}
