"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/services/api";

// Estado común de las tablas de admin: filtros/paginación por URL + ejecución de acciones
// con feedback (cargando / error / éxito) y refresh del server component.
export function useTablaAdmin(ruta: string, filtros: object) {
  const router = useRouter();
  const [cargando, setCargando] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  function navegar(filtrosNuevos: object) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtrosNuevos)) {
      if (valor) params.set(clave, String(valor));
    }
    router.push(`${ruta}?${params.toString()}`);
  }

  async function ejecutar(id: number | string, accion: () => Promise<unknown>, mensajeExito: string): Promise<boolean> {
    setCargando(id);
    setError(null);
    setExito(null);
    try {
      await accion();
      setExito(mensajeExito);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
      return false;
    } finally {
      setCargando(null);
    }
  }

  return {
    cargando,
    error,
    exito,
    ejecutar,
    aplicarFiltros: (nuevos: object) => navegar({ ...filtros, ...nuevos, page: 1 }),
    irAPagina: (page: number) => navegar({ ...filtros, page }),
  };
}
