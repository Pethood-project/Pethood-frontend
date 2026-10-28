"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Desktop: links en línea. ≤960px: se ocultan y el botón hamburguesa despliega el panel.
export function SiteNav({ panel }: { panel?: string }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        aria-controls="site-nav"
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? <X size={24} /> : <Menu size={24} />}
      </button>
      <nav id="site-nav" className={abierto ? "open" : undefined}>
        <Link href="/#funciones" onClick={cerrar}>Qué hacemos</Link>
        <Link href="/#registro" onClick={cerrar}>Registrá tu refugio</Link>
        <Link href="/faq" onClick={cerrar}>Preguntas frecuentes</Link>
        <Link href="/equipo" onClick={cerrar}>Equipo</Link>
        <Link href="/equipo#contacto" onClick={cerrar}>Contacto</Link>
        <Link href="/descargar" onClick={cerrar}>Descargá la app</Link>
        <Link href={panel ?? "/login"} onClick={cerrar} className="btn">
          {panel ? "Ir al panel" : "Ingresar"}
        </Link>
      </nav>
    </>
  );
}
