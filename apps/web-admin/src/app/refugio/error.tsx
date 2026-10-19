"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Error de cualquier sección del panel del refugio (el dashboard tiene el suyo). El caso típico
// es la API caída o reiniciándose: el fetch del server component falla con "fetch failed".
export default function ErrorRefugio({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const sinConexion = /fetch failed|ECONNREFUSED/i.test(error.message);

  function reintentar() {
    // Los datos vienen de un server component: hay que volver a pedirlos, no solo re-renderizar.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-semibold text-red-800">No pudimos cargar esta sección</h1>
      <p className="mt-2 text-sm text-red-600">
        {sinConexion
          ? "No pudimos conectarnos con el servidor. Revisá que la API esté levantada y probá de nuevo."
          : error.message || "Ocurrió un error inesperado."}
      </p>
      <div className="mt-4 flex justify-center">
        <Button forma="pastilla" onClick={reintentar}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
