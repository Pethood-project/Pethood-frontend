import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { listarCatalogo } from "@/services/admin-catalogos";
import { CATALOGOS, type Catalogo, type FiltrosCatalogo } from "@/types/admin-catalogos";
import { CatalogosTabla } from "./CatalogosTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// ABM de catálogos (api-admin-catalogos.md). El catálogo activo viaja en `?catalogo=`.
export default async function CatalogosAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";

  const catalogo = (CATALOGOS.some((c) => c.id === params.catalogo) ? params.catalogo : "especies") as Catalogo;
  const filtros: FiltrosCatalogo = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    incluirBajas: params.incluirBajas === "true" ? "true" : undefined,
  };

  const [lista, especies] = await Promise.all([
    listarCatalogo(catalogo, filtros, token),
    // Las razas se crean sobre una especie: el modal necesita el listado.
    catalogo === "razas" ? listarCatalogo("especies", { limit: 50 }, token) : null,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl text-neutral-900">Catálogos</h1>
        <p className="text-base text-neutral-700">Valores base que usan los formularios de la plataforma.</p>
      </div>
      <CatalogosTabla
        catalogo={catalogo}
        lista={lista}
        filtros={filtros}
        especies={especies?.items ?? []}
        token={token}
      />
    </div>
  );
}
