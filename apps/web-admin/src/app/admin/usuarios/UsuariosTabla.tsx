"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, RotateCcw, ShieldOff, UserCog, UserX } from "lucide-react";
import { Feedback } from "@/components/ui/Feedback";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { RolBadge } from "@/components/ui/RolBadge";
import { Pagination } from "@/components/ui/Pagination";
import { AccionButton } from "@/components/ui/AccionButton";
import {
  bajaUsuario,
  gestionarRoles,
  reactivarUsuario,
  suspenderUsuario,
  verificarUsuario,
} from "@/services/admin-usuarios";
import { ApiError } from "@/services/api";
import type { FiltrosUsuarios, ListaUsuarios, UsuarioAdmin } from "@/types/admin-usuarios";
import { MotivoModal } from "@/components/admin/MotivoModal";
import { RolesModal } from "./RolesModal";

export function UsuariosTabla({
  lista,
  filtros,
  token,
}: {
  lista: ListaUsuarios;
  filtros: FiltrosUsuarios;
  token: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [modalSuspender, setModalSuspender] = useState<UsuarioAdmin | null>(null);
  const [modalBaja, setModalBaja] = useState<UsuarioAdmin | null>(null);
  const [modalRoles, setModalRoles] = useState<UsuarioAdmin | null>(null);

  function aplicarFiltros(nuevos: Partial<FiltrosUsuarios>) {
    const params = new URLSearchParams();
    const combinados = { ...filtros, ...nuevos, page: 1 };
    for (const [clave, valor] of Object.entries(combinados)) {
      if (valor) params.set(clave, String(valor));
    }
    router.push(`/admin/usuarios?${params.toString()}`);
  }

  function irAPagina(page: number) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries({ ...filtros, page })) {
      if (valor) params.set(clave, String(valor));
    }
    router.push(`/admin/usuarios?${params.toString()}`);
  }

  async function ejecutar(id: number, accion: () => Promise<unknown>, mensajeExito: string) {
    setCargando(id);
    setError(null);
    setExito(null);
    try {
      await accion();
      setExito(mensajeExito);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Buscar</label>
          <input
            type="text"
            defaultValue={filtros.q ?? ""}
            placeholder="Nombre, apellido o email"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
            onKeyDown={(e) => {
              if (e.key === "Enter") aplicarFiltros({ q: e.currentTarget.value });
            }}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Rol</label>
          <select
            defaultValue={filtros.rol ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
            onChange={(e) => aplicarFiltros({ rol: (e.target.value || undefined) as FiltrosUsuarios["rol"] })}
          >
            <option value="">Todos</option>
            <option value="ADOPTANTE">Adoptante</option>
            <option value="MIEMBRO_REFUGIO">Refugio</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Estado</label>
          <select
            defaultValue={filtros.estado ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
            onChange={(e) => aplicarFiltros({ estado: (e.target.value || undefined) as FiltrosUsuarios["estado"] })}
          >
            <option value="">Todos</option>
            <option value="Pendiente_Verificacion">Pendiente de verificación</option>
            <option value="Activo">Activo</option>
            <option value="Suspendido">Suspendido</option>
            <option value="Inactivo">Dado de baja</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Verificado</label>
          <select
            defaultValue={filtros.verificado ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
            onChange={(e) =>
              aplicarFiltros({ verificado: (e.target.value || undefined) as FiltrosUsuarios["verificado"] })
            }
          >
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {error && <Feedback tipo="error" mensaje={error} />}
      {exito && <Feedback tipo="exito" mensaje={exito} />}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-center">Usuario</th>
              <th className="px-4 py-3 text-center">Email</th>
              <th className="px-4 py-3 text-center">Roles</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Verificado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No hay usuarios que coincidan con los filtros.
                </td>
              </tr>
            )}
            {lista.usuarios.map((usuario) => {
              const esAdmin = usuario.roles.includes("ADMIN");
              return (
                <tr key={usuario.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-center text-neutral-900">
                    {usuario.nombre} {usuario.apellido}
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-600">{usuario.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-center gap-1">
                      {usuario.roles.map((rol) => (
                        <RolBadge key={rol} rol={rol} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <EstadoBadge estado={usuario.estado} />
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-600">{usuario.verificado ? "Sí" : "No"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-center gap-2">
                      {usuario.estado === "Pendiente_Verificacion" && (
                        <AccionButton
                          icono={BadgeCheck}
                          tono="exito"
                          disabled={cargando === usuario.id}
                          onClick={() =>
                            ejecutar(
                              usuario.id,
                              () => verificarUsuario(usuario.id, token),
                              "Usuario verificado correctamente.",
                            )
                          }
                        >
                          Verificar
                        </AccionButton>
                      )}
                      {!esAdmin && usuario.estado === "Activo" && (
                        <AccionButton icono={ShieldOff} tono="peligro" onClick={() => setModalSuspender(usuario)}>
                          Suspender
                        </AccionButton>
                      )}
                      {usuario.estado === "Suspendido" && (
                        <AccionButton
                          icono={RotateCcw}
                          tono="exito"
                          disabled={cargando === usuario.id}
                          onClick={() =>
                            ejecutar(
                              usuario.id,
                              () => reactivarUsuario(usuario.id, token),
                              "Usuario reactivado correctamente.",
                            )
                          }
                        >
                          Reactivar
                        </AccionButton>
                      )}
                      {!esAdmin && usuario.estado !== "Inactivo" && (
                        <AccionButton icono={UserX} tono="peligro" onClick={() => setModalBaja(usuario)}>
                          Dar de baja
                        </AccionButton>
                      )}
                      {!esAdmin && (
                        <AccionButton icono={UserCog} tono="neutral" onClick={() => setModalRoles(usuario)}>
                          Roles
                        </AccionButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={lista.page} limit={lista.limit} total={lista.total} onCambiar={irAPagina} />

      {modalSuspender && (
        <MotivoModal
          titulo={`Suspender a ${modalSuspender.nombre} ${modalSuspender.apellido}`}
          onCerrar={() => setModalSuspender(null)}
          onConfirmar={(motivo) =>
            ejecutar(
              modalSuspender.id,
              () => suspenderUsuario(modalSuspender.id, motivo, token),
              "Usuario suspendido correctamente.",
            ).then(() => setModalSuspender(null))
          }
        />
      )}

      {modalBaja && (
        <MotivoModal
          titulo={`Dar de baja a ${modalBaja.nombre} ${modalBaja.apellido}`}
          descripcion="Esta acción no tiene reversión por API."
          onCerrar={() => setModalBaja(null)}
          onConfirmar={(motivo) =>
            ejecutar(
              modalBaja.id,
              () => bajaUsuario(modalBaja.id, motivo, token),
              "Usuario dado de baja correctamente.",
            ).then(() => setModalBaja(null))
          }
        />
      )}

      {modalRoles && (
        <RolesModal
          usuario={modalRoles}
          token={token}
          onCerrar={() => setModalRoles(null)}
          onConfirmar={async (body) => {
            await ejecutar(
              modalRoles.id,
              () => gestionarRoles(modalRoles.id, body, token),
              "Roles actualizados correctamente.",
            );
            setModalRoles(null);
          }}
        />
      )}
    </div>
  );
}
