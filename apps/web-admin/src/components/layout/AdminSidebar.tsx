import { LayoutDashboard, Home, PawPrint, Megaphone, ClipboardList, Flag, Users, ShieldAlert, Tags, Inbox, CircleHelp } from "lucide-react";
import { Sidebar } from "./Sidebar";

const ICONO = "h-5 w-5 shrink-0";

// Funciones exclusivas del rol Administrador — CLAUDE.md.
const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icono: <LayoutDashboard className={ICONO} /> },
  { href: "/admin/refugios", label: "Refugios", icono: <Home className={ICONO} /> },
  { href: "/admin/mascotas", label: "Mascotas", icono: <PawPrint className={ICONO} /> },
  { href: "/admin/publicaciones", label: "Publicaciones", icono: <Megaphone className={ICONO} /> },
  { href: "/admin/solicitudes", label: "Solicitudes", icono: <ClipboardList className={ICONO} /> },
  { href: "/admin/campanas", label: "Campañas", icono: <Flag className={ICONO} /> },
  { href: "/admin/usuarios", label: "Usuarios", icono: <Users className={ICONO} /> },
  { href: "/admin/moderacion", label: "Moderación", icono: <ShieldAlert className={ICONO} /> },
  { href: "/admin/consultas", label: "Consultas", icono: <Inbox className={ICONO} /> },
  { href: "/admin/faqs", label: "FAQs", icono: <CircleHelp className={ICONO} /> },
  { href: "/admin/catalogos", label: "Catálogos", icono: <Tags className={ICONO} /> },
];

export function AdminSidebar() {
  return <Sidebar links={LINKS} />;
}
