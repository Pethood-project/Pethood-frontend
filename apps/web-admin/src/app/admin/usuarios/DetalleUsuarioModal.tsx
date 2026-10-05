"use client";

import {
  Avatar,
  Dato,
  DetalleModal,
  Metrica,
  PieVerificar,
  FotosVerificacion,
  Resenas,
  Seccion,
  dia,
} from "@/components/admin/Detalle";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { RolBadge } from "@/components/ui/RolBadge";
import { obtenerUsuario, verificarUsuario } from "@/services/admin-usuarios";

/** Con `onVerificado` el modal pasa a ser el de verificación: suma el material a revisar y el botón. */
export function DetalleUsuarioModal({
  id,
  token,
  onCerrar,
  onVerificado,
}: {
  id: number;
  token: string;
  onCerrar: () => void;
  onVerificado?: () => void;
}) {
  return (
    <DetalleModal
      titulo={onVerificado ? "Verificar usuario" : "Detalle del usuario"}
      ancho={onVerificado ? "max-w-3xl" : "max-w-2xl"}
      pie={
        onVerificado
          ? () => (
              <PieVerificar
                onCerrar={onCerrar}
                onConfirmar={async () => {
                  await verificarUsuario(id, token);
                  onVerificado();
                }}
              />
            )
          : undefined
      }
      clave={`${id}:${token}`}
      pedir={() => obtenerUsuario(id, token)}
      onCerrar={onCerrar}
    >
      {({ usuario: u, resumen, resenas }) => (
        <>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Avatar url={u.imagenUrl} nombre={u.nombre} />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-heading text-lg text-neutral-900">
                  {u.nombre} {u.apellido}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <EstadoBadge estado={u.estado} />
                  {u.roles.map((r) => (
                    <RolBadge key={r} rol={r} />
                  ))}
                  {u.verificado && <span className="text-xs text-green-700">Verificado</span>}
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Dato k="Email" v={u.email} />
              <Dato k="Teléfono" v={u.telefono} />
              <Dato k="DNI" v={u.dni} />
              <Dato k="Nacimiento" v={u.fechaNacimiento ? dia(u.fechaNacimiento) : null} />
              <Dato k="Zona" v={u.ubicacion} />
              <Dato k="Alta" v={dia(u.fechaAlta)} />
              <Dato k="Refugio" v={u.refugio?.nombre} />
            </dl>
            {onVerificado && <FotosVerificacion />}
            {/* Actividad y reseñas solo existen para usuarios ya verificados. */}
            {!onVerificado && (
              <>
                <Seccion titulo="Actividad">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Metrica etiqueta="Mascotas" valor={resumen.mascotas} />
                    <Metrica etiqueta="Solicitudes" valor={resumen.solicitudes} />
                    <Metrica etiqueta="Donaciones" valor={resumen.donaciones} />
                  </div>
                </Seccion>
                <Seccion titulo="Reseñas recibidas">
                  <Resenas r={resenas} />
                </Seccion>
              </>
            )}
          </div>
        </>
      )}
    </DetalleModal>
  );
}
