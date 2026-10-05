"use client";

import { useState } from "react";

// Muestra el error de un campo recién después de que el usuario lo tocó (blur) o intentó
// enviar: así el formulario no aparece lleno de rojo antes de escribir nada.
export function useTocados() {
  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [intentado, setIntentado] = useState(false);

  return {
    /** Devuelve el error solo si el campo ya fue tocado o se intentó enviar. */
    ver: (campo: string, error: string | null) => (intentado || tocados.has(campo) ? error : null),
    tocar: (campo: string) => setTocados((prev) => new Set(prev).add(campo)),
    intentarEnviar: () => setIntentado(true),
    /** Vuelve al estado limpio (ej. después de un envío exitoso que vacía el form). */
    reiniciar: () => {
      setTocados(new Set());
      setIntentado(false);
    },
  };
}
