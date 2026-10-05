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
}: {
  entidad: EntidadExportableRefugio;
  periodo: PeriodoDashboard;
  token: string;
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
