interface PantallaPendienteProps {
  gui?: string;
  hu?: string;
  titulo: string;
  descripcion: string;
}

// Placeholder de trazabilidad para pantallas todavía no implementadas — CLAUDE.md pide
// nombrar cada pantalla con su GUI-XX cuando exista.
export function PantallaPendiente({ gui, hu, titulo, descripcion }: PantallaPendienteProps) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {[gui, hu].filter(Boolean).join(" · ")}
      </p>
      <h1 className="mt-1 text-xl font-semibold text-neutral-900">{titulo}</h1>
      <p className="mt-2 max-w-xl text-sm text-neutral-500">{descripcion}</p>
    </div>
  );
}
