import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ExportacionAdmin } from "@/components/dashboard/ExportacionAdmin";

// GUI-41 — botones de export CSV por entidad (spec 009 HU-14.3). El fetch de descarga
// necesita el token en el header Authorization, así que corre client-side (ExportacionAdmin);
// acá solo se lee la cookie server-side para pasárselo, igual que el resto de admin/*.
export default async function ExportacionAdminPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  return <ExportacionAdmin token={token} />;
}
