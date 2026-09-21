"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

// Desktop: links en línea. ≤960px: se ocultan y el botón hamburguesa despliega el panel.
export function SiteNav() {
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
      <nav id="site-nav" className={abierto ? "open" : undefined} onClick={cerrar}>
        <Link href="/#funciones">Qué hacemos</Link>
        <Link href="/#registro">Registrá tu refugio</Link>
        <Link href="/faq">Preguntas frecuentes</Link>
        <Link href="/equipo">Equipo</Link>
        <Link href="/equipo#contacto">Contacto</Link>
        <Link href="/login" className="btn">
          Ingresar
        </Link>
      </nav>
    </>
  );
}
