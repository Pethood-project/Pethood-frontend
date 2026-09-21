import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, decodeSesion, tieneRol } from "@/lib/auth";
import PresentacionGUI1000 from "@/components/landing/PresentacionGUI1000";

// "/" = GUI-1000 Presentación para visitantes; con sesión válida reenvía al dashboard del rol.
export default async function Home() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const sesion = decodeSesion(token);

  if (token && !sesion) redirect("/salir");
  if (sesion) redirect(tieneRol(sesion, "ADMIN") ? "/admin/dashboard" : "/refugio/dashboard");
  return <PresentacionGUI1000 />;
}
