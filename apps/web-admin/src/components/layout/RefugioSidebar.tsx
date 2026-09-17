import { LayoutDashboard, Megaphone, Building2 } from "lucide-react";
import { Sidebar } from "./Sidebar";

const ICONO = "h-5 w-5 shrink-0";

// Funciones exclusivas del rol Refugio (ya verificado) — CLAUDE.md.
const LINKS = [
  { href: "/refugio/dashboard", label: "Dashboard", icono: <LayoutDashboard className={ICONO} /> },
  { href: "/refugio/campanas", label: "Campañas", icono: <Megaphone className={ICONO} /> },
  { href: "/refugio/perfil", label: "Perfil público", icono: <Building2 className={ICONO} /> },
];

export function RefugioSidebar() {
  return <Sidebar titulo="Refugio" links={LINKS} />;
}
