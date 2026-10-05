"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

// Estado del drawer de la sidebar en pantallas chicas, compartido entre Topbar (botón) y Sidebar.
const Ctx = createContext<{
  abierto: boolean;
  setAbierto: (v: boolean) => void;
}>({
  abierto: false,
  setAbierto: () => {},
});

export const useMenuMovil = () => useContext(Ctx);

export function MenuMovilProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Ctx.Provider value={{ abierto, setAbierto }}>{children}</Ctx.Provider>
  );
}

export function BotonMenu() {
  const { abierto, setAbierto } = useMenuMovil();
  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      className="rounded-md p-1.5 text-neutral-700 hover:bg-neutral-200 md:hidden"
      aria-label="Abrir menú"
      aria-expanded={abierto}
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
