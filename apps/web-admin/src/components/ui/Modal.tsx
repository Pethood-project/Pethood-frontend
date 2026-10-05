"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface ModalProps {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  /** Clase de ancho máximo. Por defecto `max-w-lg`. */
  ancho?: string;
  /** Pie fijo debajo del cuerpo (acciones). El cuerpo es lo único que scrollea. */
  pie?: ReactNode;
}

const DURACION_SALIDA = 150; // ms, igual que `modal-salida` en globals.css

// Modales abiertos, el último es el de arriba: Escape cierra solo ese.
const pila: symbol[] = [];

export function Modal({ titulo, onCerrar, children, ancho = "max-w-lg", pie }: ModalProps) {
  const [saliendo, setSaliendo] = useState(false);
  const id = useRef(Symbol("modal"));
  const alCerrar = useRef(onCerrar);
  useEffect(() => {
    alCerrar.current = onCerrar;
  });

  // Anima la salida y recién después avisa al padre (que lo desmonta).
  const cerrando = useRef(false);
  const cerrar = useCallback(() => {
    if (cerrando.current) return;
    cerrando.current = true;
    setSaliendo(true);
    setTimeout(() => alCerrar.current(), DURACION_SALIDA);
  }, []);

  useEffect(() => {
    const miId = id.current;
    pila.push(miId);
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pila[pila.length - 1] === miId) cerrar();
    };
    document.addEventListener("keydown", alTeclear);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      pila.splice(pila.indexOf(miId), 1);
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflow;
    };
  }, [cerrar]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4 ${saliendo ? "animate-modal-fondo-salida" : "animate-modal-fondo"}`}
      // mousedown (no click): arrastrar para seleccionar texto y soltar afuera no cierra.
      onMouseDown={(e) => e.target === e.currentTarget && cerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-lg sm:max-h-[90vh] sm:rounded-lg ${ancho} ${saliendo ? "animate-modal-salida" : "animate-modal-entrada"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-neutral-900">{titulo}</h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="-mr-2 rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {pie && <div className="shrink-0 border-t border-neutral-100 px-4 py-4 sm:px-5">{pie}</div>}
      </div>
    </div>
  );
}
