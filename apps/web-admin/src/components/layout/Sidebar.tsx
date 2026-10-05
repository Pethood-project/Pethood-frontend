"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { useMenuMovil } from "./MenuMovil";

export interface SidebarLink {
  href: string;
  label: string;
  icono: ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
}

// El alto y el texto de cada ítem del menú mobile se calculan según el alto de pantalla (ver `estiloItem`).
const ITEM_MOVIL =
  "flex w-80 max-w-[85vw] items-center gap-3 rounded-2xl border px-6 font-medium transition-all duration-200 active:scale-95 [&_svg]:h-[1.25em] [&_svg]:w-[1.25em] [&_svg]:shrink-0";

export function Sidebar({ links }: SidebarProps) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = useState(false);
  const { abierto, setAbierto } = useMenuMovil();

  // Al navegar en mobile se cierra el drawer.
  useEffect(() => setAbierto(false), [pathname, setAbierto]);

  // Con el menú a pantalla completa abierto no debe scrollear nada por detrás.
  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  // Ícono anclado a la izquierda (mismo x abierto/cerrado) y etiqueta siempre montada que solo
  // se desvanece: así nada salta mientras anima el ancho.
  const fila =
    "flex w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg px-4 py-2.5 text-base font-medium transition-colors";
  // Menú mobile de tamaño dinámico: reparte el alto de pantalla entre todos los ítems (links + Salir + Cerrar),
  // con piso y techo para que ni se aplaste ni se agrande de más. `svh` = alto real con las barras del navegador.
  const estiloItem = (delayMs: number) => ({
    transitionDelay: abierto ? `${delayMs}ms` : "0ms",
    height: `clamp(36px, calc((100svh - 3rem) / ${links.length + 2} - 8px), 60px)`,
    fontSize: "clamp(14px, 2.4svh, 18px)",
  });
  const etiqueta = `transition-opacity duration-200 ${colapsado ? "md:opacity-0" : ""}`;

  return (
    <>
      {/* Mobile: menú a pantalla completa, con fundido y ítems que entran escalonados. */}
      <div
        aria-hidden={!abierto}
        className={`fixed inset-0 z-50 flex flex-col bg-neutral-900 transition-opacity duration-200 md:hidden ${
          abierto ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-6 py-4">
          <div className="my-auto flex w-full flex-col items-center gap-2">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setAbierto(false)}
                tabIndex={abierto ? 0 : -1}
                style={estiloItem(i * 30)}
                className={`${ITEM_MOVIL} ${
                  pathname.startsWith(link.href)
                    ? "border-pethood-orange/40 bg-pethood-orange/15 text-pethood-orange-dark"
                    : "border-white/10 bg-white/5 text-white/80"
                } ${abierto ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              >
                {link.icono}
                {link.label}
              </Link>
            ))}
            <form
              action={logoutAction}
              style={{ transitionDelay: abierto ? `${links.length * 30}ms` : "0ms" }}
              className={`w-80 max-w-[85vw] transition-all duration-200 ${
                abierto ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <button
                type="submit"
                tabIndex={abierto ? 0 : -1}
                style={estiloItem(0)}
                className={`${ITEM_MOVIL} w-full justify-center border-white/10 bg-white/5 text-red-400`}
              >
                <LogOut />
                Salir
              </button>
            </form>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              tabIndex={abierto ? 0 : -1}
              style={estiloItem((links.length + 1) * 30)}
              className={`${ITEM_MOVIL} justify-center border-pethood-orange bg-pethood-orange text-white ${
                abierto ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              Cerrar menú
            </button>
          </div>
        </nav>
      </div>

      <aside
        className={`hidden shrink-0 flex-col overflow-hidden bg-neutral-900 transition-[width] duration-200 ease-in-out md:flex ${
          colapsado ? "w-[76px]" : "w-64"
        }`}
      >
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pt-4">
          {links.map((link) => {
            const activo = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={colapsado ? link.label : undefined}
                className={`${fila} ${
                  activo
                    ? "bg-pethood-orange/15 text-pethood-orange-dark"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                {link.icono}
                <span className={etiqueta}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setColapsado((v) => !v)}
            className={`${fila} text-white/40 hover:bg-white/5 hover:text-white/70`}
            aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
          >
            {colapsado ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" />
            )}
            <span className={etiqueta}>Colapsar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
