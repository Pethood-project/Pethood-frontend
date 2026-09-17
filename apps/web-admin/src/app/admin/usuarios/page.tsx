import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { listarUsuarios } from "@/services/admin-usuarios";
import type { FiltrosUsuarios } from "@/types/admin-usuarios";
import { UsuariosTabla } from "./UsuariosTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// HU-2.1 / HU-2.3 / HU-2.5 — listado + verificación + roles + suspensión + baja de usuarios.
export default async function UsuariosAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";

  const filtros: FiltrosUsuarios = {
    page: params.page ? Number(params.page) : 1,
    q: params.q,
    rol: params.rol as FiltrosUsuarios["rol"],
    estado: params.estado as FiltrosUsuarios["estado"],
    verificado: params.verificado as FiltrosUsuarios["verificado"],
  };

  const lista = await listarUsuarios(filtros, token);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Usuarios</h1>
        <p className="text-sm text-neutral-700">Verificación, roles, suspensión y baja de cuentas.</p>
      </div>

      <UsuariosTabla lista={lista} filtros={filtros} token={token} />
    </div>
  );
}
