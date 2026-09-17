"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const MIN = 1;
const MAX = 500;

// Modal de confirmación con motivo obligatorio — regla transversal #6 (spec 002) para
// suspender/dar de baja usuarios y refugios. Validación acá es solo UX, el backend re-valida.
export function MotivoModal({
  titulo,
  descripcion,
  onCerrar,
  onConfirmar,
}: {
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const motivoValido = motivo.trim().length >= MIN && motivo.trim().length <= MAX;

  async function confirmar() {
    if (!motivoValido) {
      setErrorLocal("Ingresá un motivo (hasta 500 caracteres).");
      return;
    }
    setErrorLocal(null);
    setEnviando(true);
    try {
      await onConfirmar(motivo.trim());
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <div className="space-y-3">
        {descripcion && <p className="text-sm text-neutral-600">{descripcion}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="motivo">
            Motivo
          </label>
          <textarea
            id="motivo"
            rows={3}
            maxLength={MAX}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            placeholder="Contá brevemente el motivo de esta acción"
          />
          <p className="mt-1 text-right text-xs text-neutral-400">{motivo.length}/{MAX}</p>
        </div>

        {errorLocal && <p className="text-sm text-red-700">{errorLocal}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={enviando || !motivoValido}>
            {enviando ? "Confirmando…" : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
