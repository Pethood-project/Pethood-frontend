"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import type { PeriodoDashboard } from "@/types/dashboard";

// GUI-38 — selector de rango mensual (desde/hasta) para el dashboard de refugio. Actualiza
// la URL (?desde=YYYY-MM&hasta=YYYY-MM) para que el server component vuelva a pedir el
// dashboard con el período nuevo, mismo patrón que cualquier filtro basado en searchParams.
export function PeriodoSelector({ periodo }: { periodo: PeriodoDashboard }) {
  const router = useRouter();
  const pathname = usePathname();
  const [desde, setDesde] = useState(periodo.desde);
  const [hasta, setHasta] = useState(periodo.hasta);
  const [error, setError] = useState<string | null>(null);

  function aplicar() {
    if (desde > hasta) {
      setError("El mes 'desde' no puede ser posterior al mes 'hasta'.");
      return;
    }
    setError(null);
    router.push(`${pathname}?desde=${desde}&hasta=${hasta}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2.5 rounded-lg border border-neutral-300 bg-neutral-100 px-3.5 py-2">
        <span className="text-sm font-semibold text-neutral-700">Período:</span>
        <input
          type="month"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="rounded border border-transparent bg-transparent text-base font-medium text-neutral-900 outline-none hover:border-neutral-300 focus:border-pethood-orange"
          aria-label="Mes desde"
        />
        <span className="text-neutral-500">–</span>
        <input
          type="month"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="rounded border border-transparent bg-transparent text-base font-medium text-neutral-900 outline-none hover:border-neutral-300 focus:border-pethood-orange"
          aria-label="Mes hasta"
        />
        <button
          type="button"
          onClick={aplicar}
          className="ml-1 rounded-md bg-pethood-orange px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pethood-orange-dark"
        >
          Aplicar
        </button>
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
