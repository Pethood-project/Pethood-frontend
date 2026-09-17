"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { altaRefugio } from "@/services/admin-usuarios";
import { ApiError } from "@/services/api";
import type { AltaRefugioBody } from "@/types/admin-usuarios";

const CAMPO_VACIO = "Este campo es obligatorio.";

// HU-2.4 — alta de refugio. Nace en Pendiente_Verificacion/verificado=false (regla 10, spec 002),
// no hay atajo desde el alta: la habilitación pasa siempre por HU-2.2 (verificar).
export function AltaRefugioModal({
  token,
  onCerrar,
  onCreado,
}: {
  token: string;
  onCerrar: () => void;
  onCreado: () => void;
}) {
  const [form, setForm] = useState<AltaRefugioBody>({ nombre: "", direccion: "", telefono: "", email: "", descripcion: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valido = form.nombre.trim().length > 0 && form.direccion.trim().length > 0;

  function set<K extends keyof AltaRefugioBody>(campo: K, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function confirmar() {
    if (!valido) {
      setError(CAMPO_VACIO);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await altaRefugio(
        {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          telefono: form.telefono?.trim() || undefined,
          email: form.email?.trim() || undefined,
          descripcion: form.descripcion?.trim() || undefined,
        },
        token,
      );
      onCreado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos crear el refugio. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Nuevo refugio" onCerrar={onCerrar}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="nombre">
            Nombre *
          </label>
          <input
            id="nombre"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="direccion">
            Dirección *
          </label>
          <input
            id="direccion"
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="telefono">
              Teléfono
            </label>
            <input
              id="telefono"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            rows={3}
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={enviando || !valido}>
            {enviando ? "Creando…" : "Crear refugio"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
