import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, decodeSesion, tieneRol } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { MenuMovilProvider } from "@/components/layout/MenuMovil";
import { Topbar } from "@/components/layout/Topbar";

// El proxy (src/proxy.ts) ya filtra por UX; esta verificación server-side es la segunda
// capa recomendada por Next.js para no depender solo del proxy (ver docs/proxy.md).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const sesion = decodeSesion(token);

  if (!sesion) redirect(token ? "/salir" : "/login");
  if (!tieneRol(sesion, "ADMIN")) redirect("/refugio/dashboard");

  return (
    <MenuMovilProvider>
      <div className="flex h-screen flex-col">
        <Topbar rol="Administrador" />
        <div className="flex min-h-0 flex-1">
          <AdminSidebar />
          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </MenuMovilProvider>
  );
}
