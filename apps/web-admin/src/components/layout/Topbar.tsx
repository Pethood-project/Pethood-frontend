import { LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BotonCerrarSesion } from "./BotonCerrarSesion";
import { BotonMenu } from "./MenuMovil";

interface TopbarProps {
  rol: string;
}

export function Topbar({ rol }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-300 bg-neutral-100 px-4 md:px-6">
      <div className="flex items-center gap-2">
        <BotonMenu />
        <Link
          href="/"
          title="Ir al inicio"
          className="flex items-center gap-2 font-heading text-lg text-pethood-accent-700"
        >
          <Image src="/img/logo.png" alt="Logo PetHood" width={32} height={32} />
          PetHood
        </Link>
      </div>
      <div className="flex items-center gap-3 text-base text-neutral-700">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pethood-accent-200 bg-pethood-accent-100 text-pethood-accent-700">
          <UserRound className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="hidden sm:inline">{rol}</span>
        <BotonCerrarSesion
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
        </BotonCerrarSesion>
      </div>
    </header>
  );
}
