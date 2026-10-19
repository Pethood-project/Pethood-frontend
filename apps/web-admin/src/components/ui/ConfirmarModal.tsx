"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/services/api";

export interface Confirmacion {
  titulo: string;
  mensaje: string;
  /** Línea extra de advertencia (consecuencias que no se ven a simple vista). */
  detalle?: string;
  textoConfirmar: string;
  /** Texto del botón mientras corre la acción. Por defecto "Guardando…". */
  textoEnviando?: string;
  /** `peligro` pinta el botón de rojo: la acción no se puede deshacer. */
  peligro?: boolean;
}

// Cartel de advertencia antes de toda acción que modifica datos (regla transversal 6). Si la API
// rechaza la acción, el error queda dentro del modal para poder reintentar o cancelar.
export function ConfirmarModal({
  confirmacion,
  onConfirmar,
  onCerrar,
  children,
}: {
  confirmacion: Confirmacion;
  onConfirmar: () => Promise<void>;
  onCerrar: () => void;
  /** Campos extra (ej. comentario opcional al resolver una solicitud). */
  children?: ReactNode;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={confirmacion.titulo}
      onCerrar={() => !enviando && onCerrar()}
      pie={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" tamano="chico" forma="pastilla" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant={confirmacion.peligro ? "peligro" : "primary"}
            tamano="chico"
            forma="pastilla"
            onClick={confirmar}
            disabled={enviando}
          >
            {enviando ? (confirmacion.textoEnviando ?? "Guardando…") : confirmacion.textoConfirmar}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-3">
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${confirmacion.peligro ? "text-red-600" : "text-amber-500"}`}
          />
          <div className="space-y-1">
            <p className="text-sm text-neutral-800">{confirmacion.mensaje}</p>
            {confirmacion.detalle && <p className="text-sm text-neutral-600">{confirmacion.detalle}</p>}
          </div>
        </div>
        {children}
        {error && <Feedback tipo="error" mensaje={error} />}
      </div>
    </Modal>
  );
}
