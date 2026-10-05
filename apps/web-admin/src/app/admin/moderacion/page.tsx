import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { listarReportes } from "@/services/admin-reportes";
import type { EstadoReporte, FiltrosReportes, TipoReporte } from "@/types/admin-reportes";
import { ReportesTabla } from "./ReportesTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// HU-3.6 y HU-3.7 — reportes de moderación (spec 008). Suspender y dar de baja siguen
// siendo acciones aparte (HU-3.4 y 3.5): resolver un reporte no actúa sobre el objeto.
export default async function ModeracionAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const filtros: FiltrosReportes = {
    estado: (params.estado as EstadoReporte | undefined) ?? "pendiente",
    tipo: params.tipo as TipoReporte | undefined,
    page: params.page ? Number(params.page) : 1,
  };
  const lista = await listarReportes(filtros, token);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl text-neutral-900">Moderación</h1>
        <p className="text-base text-neutral-700">
          Reportes de publicaciones, personas, refugios, reseñas, avisos, campañas y mensajes.
        </p>
      </div>
      <ReportesTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
