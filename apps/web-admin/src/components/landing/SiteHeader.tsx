import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE, decodeSesion, tieneRol } from "@/lib/auth";
import "./landing.css";
import { SiteNav } from "./SiteNav";

export function Marca() {
  return (
    <span className="brand">
      <Image src="/img/logo.png" alt="Logo PetHood" width={44} height={44} />
      <span className="logo">PetHood</span>
    </span>
  );
}

export async function SiteHeader() {
  const sesion = decodeSesion((await cookies()).get(AUTH_COOKIE)?.value);
  const panel = sesion ? (tieneRol(sesion, "ADMIN") ? "/admin/dashboard" : "/refugio/dashboard") : undefined;
  return (
    <header>
      <div className="wrap">
        <Link href="/">
          <Marca />
        </Link>
        <SiteNav panel={panel} />
      </div>
    </header>
  );
}
