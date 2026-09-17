"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { descargarExportacion } from "@/services/dashboard";
import { ENTIDADES_EXPORTABLES, type EntidadExportable } from "@/types/dashboard";

const ETIQUETAS: Record<EntidadExportable, string> = {
  usuarios: "Usuarios",
  mascotas: "Mascotas",
  publicaciones: "Publicaciones",
  solicitudes: "Solicitudes",
  campanias: "Campañas",
};

export function ExportacionAdmin({ token }: { token: string }) {
  const [descargando, setDescargando] = useState<EntidadExportable | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportar(entidad: EntidadExportable) {
    setError(null);
    setDescargando(entidad);
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
      setDescargando(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-300 bg-neutral-100 p-6">
        <h1 className="font-heading text-xl text-neutral-900">Exportar datos</h1>
        <p className="mt-1 text-base text-neutral-700">Descarga un CSV por entidad, sin dados de baja.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {ENTIDADES_EXPORTABLES.map((entidad) => (
            <Button key={entidad} onClick={() => exportar(entidad)} disabled={descargando === entidad}>
              {descargando === entidad ? "Generando…" : `Exportar ${ETIQUETAS[entidad]}`}
            </Button>
          ))}
        </div>
      </div>

      {/* GUI-41 — error de exportación */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-700">{error}</div>
      )}
    </div>
  );
}
