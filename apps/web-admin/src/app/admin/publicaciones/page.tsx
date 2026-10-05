import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionAdmin } from "@/components/dashboard/ExportacionAdmin";
import { listarPublicaciones } from "@/services/admin-moderacion";
import type { FiltrosModeracion } from "@/types/admin-moderacion";
import { PublicacionesTabla } from "./PublicacionesTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PublicacionesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const filtros: FiltrosModeracion = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    incluirBajas: params.incluirBajas === "true" ? "true" : undefined,
  };
  const lista = await listarPublicaciones(filtros, token);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">Publicaciones</h1>
          <p className="text-base text-neutral-700">Avisos de adopción de refugios y adoptantes.</p>
        </div>
        <ExportacionAdmin entidad="publicaciones" token={token} />
      </div>
      <PublicacionesTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
