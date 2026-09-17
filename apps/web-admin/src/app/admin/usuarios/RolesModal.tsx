"use client";

import { useState } from "react";
import { Heart, Home, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BuscadorRefugio } from "@/components/admin/BuscadorRefugio";
import type { RolesBody, UsuarioAdmin } from "@/types/admin-usuarios";
import type { RolUsuario } from "@/types/auth";

const ROLES: { valor: RolUsuario; etiqueta: string; icono: LucideIcon; descripcion: string }[] = [
  { valor: "ADOPTANTE", etiqueta: "Adoptante", icono: Heart, descripcion: "Puede adoptar y hacer seguimiento" },
  { valor: "MIEMBRO_REFUGIO", etiqueta: "Refugio", icono: Home, descripcion: "Gestiona mascotas de un refugio" },
];

// HU-2.1 — agregar/quitar roles en una sola llamada. ADMIN queda fuera de esta UI:
// el backend rechaza modificar roles de administradores (NO_SE_PUEDE_EDITAR_ADMIN).
export function RolesModal({
  usuario,
  token,
  onCerrar,
  onConfirmar,
}: {
  usuario: UsuarioAdmin;
  token: string;
  onCerrar: () => void;
  onConfirmar: (body: RolesBody) => Promise<void>;
}) {
  const [seleccionados, setSeleccionados] = useState<Set<RolUsuario>>(new Set(usuario.roles));
  const [refugioId, setRefugioId] = useState<number | null>(usuario.refugioId);
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  function alternar(rol: RolUsuario) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(rol)) nuevo.delete(rol);
      else nuevo.add(rol);
      return nuevo;
    });
  }

  async function confirmar() {
    const agregar = ROLES.map((r) => r.valor).filter((r) => seleccionados.has(r) && !usuario.roles.includes(r));
    const quitar = usuario.roles.filter((r) => r !== "ADMIN" && !seleccionados.has(r));

    if (seleccionados.has("MIEMBRO_REFUGIO") && !refugioId) {
      setErrorLocal("Indicá el ID del refugio al agregar el rol Refugio.");
      return;
    }
    if (agregar.length === 0 && quitar.length === 0) {
      setErrorLocal("No hay cambios para guardar.");
      return;
    }

    setErrorLocal(null);
    setEnviando(true);
    try {
      await onConfirmar({
        agregar,
        quitar,
        refugioId: seleccionados.has("MIEMBRO_REFUGIO") ? (refugioId ?? undefined) : undefined,
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Roles de ${usuario.nombre} ${usuario.apellido}`} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((rol) => {
            const activo = seleccionados.has(rol.valor);
            const Icono = rol.icono;
            return (
              <button
                key={rol.valor}
                type="button"
                onClick={() => alternar(rol.valor)}
                aria-pressed={activo}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                  activo
                    ? "border-pethood-orange bg-pethood-beige"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icono
                    size={16}
                    className={activo ? "text-pethood-orange-dark" : "text-neutral-400"}
                  />
                  <span className={`text-sm font-medium ${activo ? "text-neutral-900" : "text-neutral-700"}`}>
                    {rol.etiqueta}
                  </span>
                </span>
                <span className="text-xs text-neutral-500">{rol.descripcion}</span>
              </button>
            );
          })}
        </div>

        {seleccionados.has("MIEMBRO_REFUGIO") && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <label className="mb-1 block text-sm font-medium text-neutral-700">Refugio</label>
            <BuscadorRefugio
              token={token}
              refugioId={refugioId}
              onSeleccionar={(refugio) => setRefugioId(refugio?.id ?? null)}
            />
          </div>
        )}

        {errorLocal && <p className="text-sm text-red-700">{errorLocal}</p>}

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3">
          <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
