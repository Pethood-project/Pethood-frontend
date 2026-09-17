import { Heart, Home, ShieldCheck, type LucideIcon } from "lucide-react";
import type { RolUsuario } from "@/types/auth";
import { ETIQUETA_ROL } from "@/types/auth";

const ICONO: Record<RolUsuario, LucideIcon> = {
  ADMIN: ShieldCheck,
  MIEMBRO_REFUGIO: Home,
  ADOPTANTE: Heart,
};

const COLOR: Record<RolUsuario, string> = {
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  MIEMBRO_REFUGIO: "bg-pethood-beige text-pethood-orange-dark border-pethood-beige-dark",
  ADOPTANTE: "bg-rose-50 text-rose-700 border-rose-200",
};

export function RolBadge({ rol }: { rol: RolUsuario }) {
  const Icono = ICONO[rol];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${COLOR[rol]}`}>
      <Icono size={12} />
      {ETIQUETA_ROL[rol]}
    </span>
  );
}
