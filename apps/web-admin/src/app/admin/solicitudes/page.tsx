import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionAdmin } from "@/components/dashboard/ExportacionAdmin";
import { listarSolicitudes } from "@/services/admin-moderacion";
import type { FiltrosModeracion } from "@/types/admin-moderacion";
import { SolicitudesTabla } from "./SolicitudesTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SolicitudesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const filtros: FiltrosModeracion = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    tipo: params.tipo,
    desde: params.desde,
    hasta: params.hasta,
  };
  const lista = await listarSolicitudes(filtros, token);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">Solicitudes</h1>
          <p className="text-base text-neutral-700">Solo lectura: las resuelve el refugio.</p>
        </div>
        <ExportacionAdmin entidad="solicitudes" token={token} />
      </div>
      <SolicitudesTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
