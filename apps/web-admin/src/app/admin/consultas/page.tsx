import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { listarConsultas } from "@/services/soporte";
import { ConsultasTabla } from "./ConsultasTabla";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// HU-15.2 — consultas de soporte enviadas desde el formulario público.
export default async function ConsultasAdminPage({ searchParams }: PageProps) {
  const { resuelta } = await searchParams;
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const filtro = resuelta === "true" ? true : resuelta === "false" ? false : undefined;

  const consultas = await listarConsultas(filtro, token);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Consultas de soporte</h1>
        <p className="text-sm text-neutral-700">Mensajes del formulario de contacto público.</p>
      </div>

      <ConsultasTabla consultas={consultas} filtro={resuelta ?? ""} token={token} />
    </div>
  );
}
