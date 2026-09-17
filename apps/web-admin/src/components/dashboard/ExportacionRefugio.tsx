"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { descargarExportacionRefugio } from "@/services/dashboard";
import { ENTIDADES_EXPORTABLES_REFUGIO, type EntidadExportableRefugio, type PeriodoDashboard } from "@/types/dashboard";

const ETIQUETAS: Record<EntidadExportableRefugio, string> = {
  mascotas: "Mascotas",
  solicitudes: "Solicitudes",
  donaciones: "Donaciones",
};

// GUI-38/GUI-41 — export CSV por panel del dashboard de refugio (HU-14.3, alcance Refugio), mismo
// patrón que ExportacionAdmin: un botón por entidad, en vez de un único reporte consolidado.
export function ExportacionRefugio({ periodo, token }: { periodo: PeriodoDashboard; token: string }) {
  const [descargando, setDescargando] = useState<EntidadExportableRefugio | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportar(entidad: EntidadExportableRefugio) {
    setError(null);
    setDescargando(entidad);
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
      setDescargando(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {ENTIDADES_EXPORTABLES_REFUGIO.map((entidad) => (
          <Button
            key={entidad}
            onClick={() => exportar(entidad)}
            disabled={descargando === entidad}
            className="flex items-center gap-2"
          >
            <Download className="h-5 w-5" strokeWidth={2} />
            {descargando === entidad ? "Generando…" : `Exportar ${ETIQUETAS[entidad]}`}
          </Button>
        ))}
      </div>
      {/* GUI-41 — error de exportación */}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
