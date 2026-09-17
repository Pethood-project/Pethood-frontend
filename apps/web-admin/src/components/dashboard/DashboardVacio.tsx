// GUI-40 — BD recién sembrada, sin datos operativos todavía (spec 009 §7).
export function DashboardVacio() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">Todavía no hay datos para mostrar</h1>
      <p className="mt-2 text-sm text-neutral-700">
        Cuando haya usuarios, mascotas o publicaciones cargadas, las estadísticas van a aparecer acá.
      </p>
    </div>
  );
}
