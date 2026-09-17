import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, decodeSesion, tieneRol } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Topbar } from "@/components/layout/Topbar";

// El proxy (src/proxy.ts) ya filtra por UX; esta verificación server-side es la segunda
// capa recomendada por Next.js para no depender solo del proxy (ver docs/proxy.md).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const sesion = decodeSesion(token);

  if (!sesion) redirect(token ? "/salir" : "/login");
  if (!tieneRol(sesion, "ADMIN")) redirect("/refugio/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar rol="Administrador" />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
