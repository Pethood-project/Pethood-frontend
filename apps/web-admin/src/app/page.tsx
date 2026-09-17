import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, decodeSesion, tieneRol } from "@/lib/auth";

// "/" no tiene UI propia: reenvía a login o al dashboard del rol correspondiente.
export default async function Home() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const sesion = decodeSesion(token);

  if (!sesion) redirect(token ? "/salir" : "/login");
  if (tieneRol(sesion, "ADMIN")) redirect("/admin/dashboard");
  redirect("/refugio/dashboard");
}
