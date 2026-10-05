import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionAdmin } from "@/components/dashboard/ExportacionAdmin";
import { listarCampanas } from "@/services/admin-campanas";
import type { FiltrosCampanas } from "@/types/admin-campanas";
import { CampanasTabla } from "./CampanasTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CampanasAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const filtros: FiltrosCampanas = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    estado: params.estado,
  };
  const lista = await listarCampanas(filtros, token);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">Campañas</h1>
          <p className="text-base text-neutral-700">Campañas de donación de los refugios.</p>
        </div>
        <ExportacionAdmin entidad="campanias" token={token} />
      </div>
      <CampanasTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
