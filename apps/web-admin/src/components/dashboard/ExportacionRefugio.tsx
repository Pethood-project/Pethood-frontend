"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { descargarExportacionRefugio } from "@/services/dashboard";
import { type EntidadExportableRefugio, type PeriodoDashboard } from "@/types/dashboard";

const ETIQUETAS: Record<EntidadExportableRefugio, string> = {
  mascotas: "Mascotas",
  solicitudes: "Solicitudes",
  donaciones: "Donaciones",
};

// GUI-38/GUI-41 — export CSV del dashboard de refugio (HU-14.3, alcance Refugio): un botón por
// entidad, que se monta en el panel (Card) de esa entidad.
export function ExportacionRefugio({
  entidad,
  periodo,
  token,
  variante = "icono",
}: {
  entidad: EntidadExportableRefugio;
  periodo: PeriodoDashboard;
  token: string;
  /** `boton`: pastilla con texto, para el encabezado de los listados. */
  variante?: "icono" | "boton";
}) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setError(null);
    setDescargando(true);
    try {
      const blob = await descargarExportacionRefugio(entidad, periodo, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entidad}-refugio-${periodo.desde}_a_${periodo.hasta}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la exportación.");
    } finally {
      setDescargando(false);
    }
  }

  const titulo = error ?? `Exportar ${ETIQUETAS[entidad]} (CSV)`;

  if (variante === "boton") {
    return (
      <button
        type="button"
        onClick={exportar}
        disabled={descargando}
        title={titulo}
        className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-y-px hover:shadow active:translate-y-0 active:scale-[0.97] disabled:opacity-60 ${
          error
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-pethood-accent-600 bg-neutral-100 text-pethood-accent-700 hover:bg-pethood-accent-100"
        }`}
      >
        <Download className={`h-4 w-4 ${descargando ? "animate-pulse" : ""}`} strokeWidth={2.2} />
        {descargando ? "Exportando…" : error ? "Reintentar exportación" : "Exportar CSV"}
      </button>
    );
  }

  // Ícono suave: sin caja ni texto. Si falla la descarga (GUI-41) se pinta rojo y el tooltip dice por qué.
  return (
    <button
      type="button"
      onClick={exportar}
      disabled={descargando}
      title={titulo}
      aria-label={titulo}
      className={`shrink-0 rounded-md p-1.5 transition-colors hover:bg-pethood-accent-100 disabled:opacity-50 ${
        error ? "text-red-500" : "text-pethood-accent-600 hover:text-pethood-accent-700"
      }`}
    >
      <Download className={`h-5 w-5 ${descargando ? "animate-pulse" : ""}`} strokeWidth={2} />
    </button>
  );
}
