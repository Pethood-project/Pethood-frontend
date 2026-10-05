import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionAdmin } from "@/components/dashboard/ExportacionAdmin";
import { listarMascotas } from "@/services/admin-moderacion";
import type { FiltrosModeracion } from "@/types/admin-moderacion";
import { MascotasTabla } from "./MascotasTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function MascotasAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const filtros: FiltrosModeracion = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    incluirBajas: params.incluirBajas === "true" ? "true" : undefined,
  };
  const lista = await listarMascotas(filtros, token);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-heading text-2xl text-neutral-900">Mascotas</h1>
          <p className="text-base text-neutral-700">Todas las mascotas registradas en la plataforma.</p>
        </div>
        <ExportacionAdmin entidad="mascotas" token={token} />
      </div>
      <MascotasTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
