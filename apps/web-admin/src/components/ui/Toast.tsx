"use client";

import { CheckCircle2 } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const DURACION_MS = 3500;

const ToastContext = createContext<(mensaje: string) => void>(() => undefined);

/** Aviso de éxito que se cierra solo (regla transversal 6: feedback visual con voseo). */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ id: number; mensaje: string } | null>(null);

  const mostrar = useCallback((mensaje: string) => setAviso({ id: Date.now(), mensaje }), []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), DURACION_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
        {aviso && (
          <div
            key={aviso.id}
            role="status"
            className="animate-modal-entrada flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {aviso.mensaje}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
