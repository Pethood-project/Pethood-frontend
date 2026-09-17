"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, PawPrint } from "lucide-react";

export interface SidebarLink {
  href: string;
  label: string;
  icono: ReactNode;
}

interface SidebarProps {
  titulo: string;
  links: SidebarLink[];
}

export function Sidebar({ titulo, links }: SidebarProps) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col bg-neutral-900 transition-[width] duration-200 ${colapsado ? "w-20" : "w-64"}`}
    >
      {/* Marca — mismo bloque que GUI-15.1.1/15.2.1: ícono en cuadrado redondeado + wordmark en Caprasimo. */}
      <div className={`flex items-center gap-3 border-b border-white/10 p-4 ${colapsado ? "justify-center" : ""}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pethood-orange">
          <PawPrint className="h-5 w-5 text-white" strokeWidth={2} />
        </span>
        {!colapsado && (
          <div className="min-w-0">
            <p className="truncate font-heading text-base leading-tight text-white">PetHood</p>
            <p className="truncate text-xs leading-tight text-white/40">{titulo}</p>
          </div>
        )}
      </div>

      <div className={`flex items-center px-4 pt-3 ${colapsado ? "justify-center" : "justify-end"}`}>
        <button
          type="button"
          onClick={() => setColapsado((v) => !v)}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
        >
          {colapsado ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => {
          const activo = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={colapsado ? link.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                colapsado ? "justify-center" : ""
              } ${
                activo
                  ? "bg-pethood-orange/15 text-pethood-orange-dark"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              {link.icono}
              {!colapsado && link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
