"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { descargarExportacion } from "@/services/dashboard";
import { type EntidadExportable } from "@/types/dashboard";

const ETIQUETAS: Record<EntidadExportable, string> = {
  usuarios: "Usuarios",
  mascotas: "Mascotas",
  publicaciones: "Publicaciones",
  solicitudes: "Solicitudes",
  campanias: "Campañas",
};

// GUI-41 — export CSV del dashboard de admin: un botón por entidad, montado en el panel de esa entidad.
export function ExportacionAdmin({ entidad, token }: { entidad: EntidadExportable; token: string }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setError(null);
    setDescargando(true);
    try {
      const blob = await descargarExportacion(entidad, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entidad}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la exportación.");
    } finally {
      setDescargando(false);
    }
  }

  const titulo = error ?? `Exportar ${ETIQUETAS[entidad]} (CSV)`;

  // Ícono suave: sin caja ni texto. Si falla la descarga (GUI-41) se pinta rojo y el tooltip dice por qué.
  return (
    <button
      type="button"
      onClick={exportar}
      disabled={descargando}
      title={titulo}
      aria-label={titulo}
      className={`shrink-0 rounded-md p-1.5 transition-colors hover:bg-pethood-orange/10 disabled:opacity-50 ${
        error ? "text-red-500" : "text-pethood-orange/70 hover:text-pethood-orange-dark"
      }`}
    >
      <Download className={`h-5 w-5 ${descargando ? "animate-pulse" : ""}`} strokeWidth={2} />
    </button>
  );
}
