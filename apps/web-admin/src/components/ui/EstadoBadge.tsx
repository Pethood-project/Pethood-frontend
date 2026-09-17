// Usuario y refugio comparten el mismo ciclo de vida (spec 002): Pendiente_Verificacion →
// Activo ↔ Suspendido, con baja lógica a Inactivo desde cualquier estado.
export type EstadoCiclo = "Pendiente_Verificacion" | "Activo" | "Suspendido" | "Inactivo";

const ETIQUETA: Record<EstadoCiclo, string> = {
  Pendiente_Verificacion: "Pendiente de verificación",
  Activo: "Activo",
  Suspendido: "Suspendido",
  Inactivo: "Dado de baja",
};

const COLOR: Record<EstadoCiclo, string> = {
  Pendiente_Verificacion: "bg-amber-50 text-amber-700 border-amber-200",
  Activo: "bg-green-50 text-green-700 border-green-200",
  Suspendido: "bg-red-50 text-red-700 border-red-200",
  Inactivo: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export function EstadoBadge({ estado }: { estado: EstadoCiclo }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${COLOR[estado]}`}>{ETIQUETA[estado]}</span>
  );
}
