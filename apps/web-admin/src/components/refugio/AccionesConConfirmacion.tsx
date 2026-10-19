"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ConfirmarModal, type Confirmacion } from "@/components/ui/ConfirmarModal";
import { useToast } from "@/components/ui/Toast";

export interface AccionFila {
  clave: string;
  etiqueta: string;
  icono: LucideIcon;
  tono: "exito" | "peligro" | "info" | "neutral";
  confirmacion: Confirmacion;
  /** Toast al terminar bien. */
  exito: string;
  ejecutar: () => Promise<unknown>;
  /** Contenido extra del modal (ej. comentario). */
  extra?: ReactNode;
  /** Al abrir el cartel (ej. vaciar el comentario de una decisión anterior). */
  alAbrir?: () => void;
}

// Pastilla suave que se rellena con su color al pasar el mouse: se lee de un vistazo qué hace
// cada botón sin que la tabla se llene de bloques de color.
const BOTON =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-150 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

const TONOS: Record<AccionFila["tono"], string> = {
  exito: "border-green-200 bg-green-50 text-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white focus-visible:ring-green-500/50",
  peligro: "border-red-200 bg-red-50 text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:ring-red-500/50",
  info: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-600 hover:bg-sky-600 hover:text-white focus-visible:ring-sky-500/50",
  neutral: "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-800 hover:bg-neutral-800 hover:text-white focus-visible:ring-neutral-500/50",
};

// Botones de acción de una fila de los listados del refugio. Cada uno abre el cartel de
// confirmación; al confirmar llama a la API, refresca el server component y avisa con un toast.
export function AccionesConConfirmacion({ acciones }: { acciones: AccionFila[] }) {
  const router = useRouter();
  const toast = useToast();
  // Solo la clave: la acción se busca en cada render, así `ejecutar` y `extra` ven el estado
  // actual del padre (ej. el comentario que se está escribiendo) y no el del momento del clic.
  const [claveAbierta, setClaveAbierta] = useState<string | null>(null);
  const abierta = acciones.find((a) => a.clave === claveAbierta) ?? null;

  if (acciones.length === 0) return <span className="text-sm text-neutral-400">—</span>;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 md:justify-start min-[1360px]:flex-nowrap">
        {acciones.map((a) => (
          <button
            key={a.clave}
            type="button"
            onClick={() => {
              a.alAbrir?.();
              setClaveAbierta(a.clave);
            }}
            className={`${BOTON} ${TONOS[a.tono]}`}
          >
            <a.icono className="h-4 w-4" strokeWidth={2.2} />
            {a.etiqueta}
          </button>
        ))}
      </div>

      {abierta && (
        <ConfirmarModal
          confirmacion={abierta.confirmacion}
          onCerrar={() => setClaveAbierta(null)}
          onConfirmar={async () => {
            await abierta.ejecutar();
            setClaveAbierta(null);
            toast(abierta.exito);
            router.refresh();
          }}
        >
          {abierta.extra}
        </ConfirmarModal>
      )}
    </>
  );
}
