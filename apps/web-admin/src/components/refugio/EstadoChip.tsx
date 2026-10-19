import { etiquetaEstado } from "@/lib/formato";

// Color por nombre de catálogo (mascota, publicación, solicitud y campaña comparten la idea:
// verde = vigente/positivo, ámbar = en curso, rojo = negativo, gris = cerrado).
const TONO: Record<string, string> = {
  Disponible: "bg-green-50 text-green-700 border-green-200",
  Activa: "bg-green-50 text-green-700 border-green-200",
  Aprobada: "bg-green-50 text-green-700 border-green-200",
  Adoptado: "bg-sky-50 text-sky-700 border-sky-200",
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  En_Revision: "bg-amber-50 text-amber-700 border-amber-200",
  En_Tratamiento: "bg-amber-50 text-amber-700 border-amber-200",
  En_Transito: "bg-amber-50 text-amber-700 border-amber-200",
  Pausada: "bg-amber-50 text-amber-700 border-amber-200",
  Inactiva: "bg-neutral-100 text-neutral-600 border-neutral-200",
  Rechazada: "bg-red-50 text-red-700 border-red-200",
  Perdido: "bg-red-50 text-red-700 border-red-200",
};

const TONO_DEFECTO = "bg-neutral-100 text-neutral-600 border-neutral-200";

export function EstadoChip({ nombre }: { nombre: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-sm ${TONO[nombre] ?? TONO_DEFECTO}`}>
      {etiquetaEstado(nombre)}
    </span>
  );
}
