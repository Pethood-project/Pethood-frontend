import { Heart, Home, ShieldCheck, type LucideIcon } from "lucide-react";

import { ETIQUETA_ROL } from "@/types/auth";

import type { RolUsuario } from "@/types/auth";

const ICONO: Record<RolUsuario, LucideIcon> = {
  ADMIN: ShieldCheck,
  MIEMBRO_REFUGIO: Home,
  ADOPTANTE: Heart,
};

const COLOR: Record<RolUsuario, string> = {
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  MIEMBRO_REFUGIO: "bg-pethood-accent-100 text-pethood-accent-700 border-pethood-accent-200",
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
