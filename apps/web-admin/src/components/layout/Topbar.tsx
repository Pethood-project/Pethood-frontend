import { LogOut, PawPrint, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions";

interface TopbarProps {
  rol: string;
}

export function Topbar({ rol }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-300 bg-neutral-100 px-6">
      <span className="flex items-center gap-2 font-heading text-lg text-pethood-orange-dark">
        <PawPrint className="h-6 w-6" strokeWidth={2} />
        PetHood
      </span>
      <div className="flex items-center gap-3 text-base text-neutral-700">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pethood-orange/10 text-pethood-orange-dark">
          <UserRound className="h-5 w-5" strokeWidth={2} />
        </span>
        {rol}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </button>
        </form>
      </div>
    </header>
  );
}
