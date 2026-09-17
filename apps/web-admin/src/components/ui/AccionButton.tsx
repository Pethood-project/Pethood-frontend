import type { LucideIcon } from "lucide-react";

type Tono = "exito" | "peligro" | "info" | "neutral";

const ESTILOS: Record<Tono, string> = {
  exito: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
  peligro: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  info: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
};

// Botón de acción de fila para grillas de admin — icono + color por tono semántico
// (verificar/reactivar = éxito, suspender/baja = peligro, roles = neutral).
export function AccionButton({
  icono: Icono,
  tono,
  disabled,
  onClick,
  children,
}: {
  icono: LucideIcon;
  tono: Tono;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${ESTILOS[tono]}`}
    >
      <Icono size={13} />
      {children}
    </button>
  );
}
