import { LayoutDashboard, Home, Users, ShieldAlert, Tags, Download } from "lucide-react";
import { Sidebar } from "./Sidebar";

const ICONO = "h-5 w-5 shrink-0";

// Funciones exclusivas del rol Administrador — CLAUDE.md.
const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icono: <LayoutDashboard className={ICONO} /> },
  { href: "/admin/refugios", label: "Refugios", icono: <Home className={ICONO} /> },
  { href: "/admin/usuarios", label: "Usuarios", icono: <Users className={ICONO} /> },
  { href: "/admin/moderacion", label: "Moderación", icono: <ShieldAlert className={ICONO} /> },
  { href: "/admin/catalogos", label: "Catálogos", icono: <Tags className={ICONO} /> },
  { href: "/admin/exportacion", label: "Exportación", icono: <Download className={ICONO} /> },
];

export function AdminSidebar() {
  return <Sidebar titulo="Administrador" links={LINKS} />;
}
