import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { listarRefugios } from "@/services/admin-usuarios";
import type { FiltrosRefugios } from "@/types/admin-usuarios";
import { RefugiosTabla } from "./RefugiosTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// HU-2.2 / HU-2.4 — listado, alta, verificación, suspensión, reactivación y baja de refugios.
export default async function RefugiosAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";

  const filtros: FiltrosRefugios = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    estado: params.estado as FiltrosRefugios["estado"],
    verificado: params.verificado as FiltrosRefugios["verificado"],
  };

  const lista = await listarRefugios(filtros, token);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Refugios</h1>
          <p className="text-sm text-neutral-700">Alta, validación, suspensión y baja de refugios.</p>
        </div>
      </div>

      <RefugiosTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
