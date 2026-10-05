import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, decodeSesion } from "@/lib/auth";
import Landing from "@/components/landing/Landing";

export default async function Home() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  if (token && !decodeSesion(token)) redirect("/salir");
  return <Landing />;
}
