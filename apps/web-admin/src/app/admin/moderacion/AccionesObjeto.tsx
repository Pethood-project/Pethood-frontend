"use client";

import { Ban, Trash2 } from "lucide-react";
import { useState } from "react";
import { MotivoModal } from "@/components/admin/MotivoModal";
import { AccionButton } from "@/components/ui/AccionButton";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/services/api";
import { bajaPublicacion } from "@/services/admin-moderacion";
import { bajaAvisoPerdido, bajaResena } from "@/services/admin-reportes";
import { suspenderRefugio, suspenderUsuario } from "@/services/admin-usuarios";
import type { DetalleReporte } from "@/types/admin-reportes";

interface Accion {
  etiqueta: string;
  tono: "peligro";
  icono: typeof Ban;
  titulo: string;
  descripcion: string;
  exito: string;
  /** Sin `ejecutar` con motivo: la acción solo pide confirmar (la baja de reseña no lleva motivo). */
  conMotivo: boolean;
  ejecutar: (motivo: string, token: string) => Promise<unknown>;
}

/** Qué se le puede hacer al objeto reportado según su tipo. `null` = hoy no hay acción. */
function accionDe(r: DetalleReporte): Accion | null {
  const id = r.objeto.id;
  switch (r.tipo) {
    case "PUBLICACION":
      return {
        etiqueta: "Dar de baja la publicación", tono: "peligro", icono: Trash2, conMotivo: true,
        titulo: "Dar de baja la publicación",
        descripcion: "Deja de verse en Adoptar y se le avisa a quien la publicó con el motivo.",
        exito: "Publicación dada de baja.",
        ejecutar: (m, t) => bajaPublicacion(id, m, t),
      };
    case "USUARIO":
      return {
        etiqueta: "Suspender a la persona", tono: "peligro", icono: Ban, conMotivo: true,
        titulo: "Suspender a la persona",
        descripcion: "No va a poder operar hasta que la reactives desde Usuarios.",
        exito: "Persona suspendida.",
        ejecutar: (m, t) => suspenderUsuario(id, m, t),
      };
    case "REFUGIO":
      return {
        etiqueta: "Suspender el refugio", tono: "peligro", icono: Ban, conMotivo: true,
        titulo: "Suspender el refugio",
        descripcion: "Deja de operar hasta que lo reactives desde Refugios.",
        exito: "Refugio suspendido.",
        ejecutar: (m, t) => suspenderRefugio(id, m, t),
      };
    case "RESENA":
      return {
        etiqueta: "Dar de baja la reseña", tono: "peligro", icono: Trash2, conMotivo: false,
        titulo: "Dar de baja la reseña",
        descripcion: "La reseña deja de mostrarse y deja de contar en el promedio.",
        exito: "Reseña dada de baja.",
        ejecutar: (_m, t) => bajaResena(id, t),
      };
    case "ANIMAL_PERDIDO":
      return {
        etiqueta: "Dar de baja el aviso", tono: "peligro", icono: Trash2, conMotivo: true,
        titulo: "Dar de baja el aviso",
        descripcion: "El aviso deja de verse y se le avisa a quien lo publicó con el motivo.",
        exito: "Aviso dado de baja.",
        ejecutar: (m, t) => bajaAvisoPerdido(id, m, t),
      };
    case "MENSAJE": {
      // La acción posible sobre un mensaje es suspender a su autor (spec 008, MENSAJE).
      const autor = r.objeto.contexto?.find((m) => m.id === id)?.usuario;
      if (!autor) return null;
      return {
        etiqueta: `Suspender a ${autor.nombre}`, tono: "peligro", icono: Ban, conMotivo: true,
        titulo: `Suspender a ${autor.nombre} ${autor.apellido}`,
        descripcion: "Es quien escribió el mensaje reportado. No va a poder operar hasta que lo reactives.",
        exito: "Autor suspendido.",
        ejecutar: (m, t) => suspenderUsuario(autor.id, m, t),
      };
    }
    default:
      return null; // CAMPANIA: no hay baja hasta el Módulo 12 (HU-12.5).
  }
}

// Atajos para actuar sobre el objeto sin salir del reporte. Resolver el reporte es aparte.
export function AccionesObjeto({
  reporte,
  token,
  onHecho,
}: {
  reporte: DetalleReporte;
  token: string;
  onHecho: (mensaje: string) => unknown;
}) {
  const [abierta, setAbierta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accion = accionDe(reporte);

  if (reporte.tipo === "CAMPANIA") {
    return <p className="text-xs text-neutral-500">Todavía no hay baja de campañas: lo único posible es suspender al refugio.</p>;
  }
  // Ya actuada: el objeto está de baja o suspendido, no hay nada más que hacer acá.
  if (!accion || reporte.objeto.estado !== "ACTIVO") return null;

  async function confirmar(motivo: string) {
    if (!accion) return;
    setError(null);
    try {
      await accion.ejecutar(motivo, token);
      setAbierta(false);
      await onHecho(accion.exito);
    } catch (err) {
      setAbierta(false);
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
    }
  }

  return (
    <div className="space-y-2">
      {error && <Feedback tipo="error" mensaje={error} />}
      <AccionButton icono={accion.icono} tono={accion.tono} onClick={() => setAbierta(true)}>
        {accion.etiqueta}
      </AccionButton>

      {abierta && accion.conMotivo && (
        <MotivoModal titulo={accion.titulo} descripcion={accion.descripcion} onCerrar={() => setAbierta(false)} onConfirmar={confirmar} />
      )}
      {abierta && !accion.conMotivo && (
        <Modal titulo={accion.titulo} onCerrar={() => setAbierta(false)}>
          <p className="mb-4 text-sm text-neutral-700">{accion.descripcion} ¿Confirmás?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAbierta(false)}>Cancelar</Button>
            <Button onClick={() => confirmar("")}>Confirmar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
