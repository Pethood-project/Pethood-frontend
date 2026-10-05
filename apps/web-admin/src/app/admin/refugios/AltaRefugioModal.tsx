"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { bordeCampo, ErrorCampo } from "@/components/ui/ErrorCampo";
import { Modal } from "@/components/ui/Modal";
import { useTocados } from "@/lib/useTocados";
import { hayErrores, LIMITES, validarEmail, validarTelefono, validarTexto } from "@/lib/validation";
import { altaRefugio } from "@/services/admin-usuarios";
import { ApiError } from "@/services/api";
import type { AltaRefugioBody } from "@/types/admin-usuarios";

const INPUT = "w-full rounded-md border px-3 py-2 text-sm text-neutral-900";

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

  const { ver, tocar, intentarEnviar } = useTocados();
  const errores = {
    nombre: validarTexto(form.nombre, { etiqueta: "El nombre", ...LIMITES.refugio.nombre }),
    direccion: validarTexto(form.direccion, { etiqueta: "La dirección", ...LIMITES.refugio.direccion }),
    telefono: validarTelefono(form.telefono ?? "", false),
    email: validarEmail(form.email ?? "", false),
    descripcion: validarTexto(form.descripcion ?? "", { etiqueta: "La descripción", ...LIMITES.refugio.descripcion, obligatorio: false }),
  };

  function set<K extends keyof AltaRefugioBody>(campo: K, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function confirmar() {
    intentarEnviar();
    if (hayErrores(errores)) return;
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

  const campo = (id: "nombre" | "direccion" | "telefono" | "email", etiqueta: string, tipo: string, max: number) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={id}>
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        maxLength={max}
        value={form[id] ?? ""}
        onChange={(e) => set(id, e.target.value)}
        onBlur={() => tocar(id)}
        aria-invalid={!!ver(id, errores[id])}
        aria-describedby={`${id}-error`}
        className={`${INPUT} ${bordeCampo(ver(id, errores[id]))}`}
      />
      <ErrorCampo id={id} error={ver(id, errores[id])} />
    </div>
  );

  return (
    <Modal titulo="Nuevo refugio" onCerrar={onCerrar}>
      <div className="space-y-3">
        {campo("nombre", "Nombre *", "text", 100)}
        {campo("direccion", "Dirección *", "text", 150)}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campo("telefono", "Teléfono", "tel", 20)}
          {campo("email", "Email", "email", 100)}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            rows={3}
            maxLength={LIMITES.refugio.descripcion.max}
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            onBlur={() => tocar("descripcion")}
            aria-invalid={!!ver("descripcion", errores.descripcion)}
            aria-describedby="descripcion-error"
            className={`${INPUT} ${bordeCampo(ver("descripcion", errores.descripcion))}`}
          />
          <ErrorCampo id="descripcion" error={ver("descripcion", errores.descripcion)} />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? "Creando…" : "Crear refugio"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
