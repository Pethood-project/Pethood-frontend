"use client";

import { Check, CheckCheck, CircleStop, Pause, Play, X } from "lucide-react";
import { useState } from "react";

import {
  cambiarEstadoCampania,
  cambiarEstadoPublicacion,
  marcarSolicitudRevisada,
  resolverSolicitud,
} from "@/services/refugio";
import { ESTADOS_SOLICITUD_ABIERTA, MOTIVOS_RECHAZO, type MotivoRechazo } from "@/types/refugio";

import { AccionesConConfirmacion, type AccionFila } from "./AccionesConConfirmacion";

// Acciones por fila de Publicaciones, Solicitudes y Campañas. Qué acción se ofrece en cada
// estado espeja las transiciones del backend (que igual las re-valida); los textos de los
// carteles son los mismos que usa la app móvil para la misma acción.

const COMENTARIO_MAX = 500; // LIMITES.solicitud.comentario del backend

// --- Publicaciones (PATCH /publicaciones/:id/estado) ----------------------------------------

export function AccionesPublicacion({ id, estado, token }: { id: number; estado: string; token: string }) {
  const acciones: AccionFila[] = [];

  if (estado === "Activa") {
    acciones.push({
      clave: "pausar",
      etiqueta: "Pausar",
      icono: Pause,
      tono: "neutral",
      confirmacion: {
        titulo: "¿Seguro que querés pausar la publicación?",
        mensaje: "Va a dejar de aparecer en Adoptar y no va a recibir solicitudes nuevas.",
        textoConfirmar: "Pausar",
      },
      exito: "Pausaste la publicación.",
      ejecutar: () => cambiarEstadoPublicacion(id, "PAUSAR", token),
    });
  }
  if (estado === "Pausada") {
    acciones.push({
      clave: "reactivar",
      etiqueta: "Reactivar",
      icono: Play,
      tono: "exito",
      confirmacion: {
        titulo: "¿Seguro que querés reactivar la publicación?",
        mensaje: "Va a volver a aparecer en Adoptar y a recibir solicitudes.",
        textoConfirmar: "Reactivar",
      },
      exito: "Reactivaste la publicación.",
      ejecutar: () => cambiarEstadoPublicacion(id, "REACTIVAR", token),
    });
  }
  if (estado === "Activa" || estado === "Pausada") {
    acciones.push({
      clave: "finalizar",
      etiqueta: "Finalizar",
      icono: CircleStop,
      tono: "peligro",
      confirmacion: {
        titulo: "¿Seguro que querés finalizar la publicación?",
        mensaje: "Deja de aparecer en Adoptar y ya no se puede reactivar ni editar.",
        textoConfirmar: "Finalizar",
        peligro: true,
      },
      exito: "Finalizaste la publicación.",
      ejecutar: () => cambiarEstadoPublicacion(id, "FINALIZAR", token),
    });
  }

  return <AccionesConConfirmacion acciones={acciones} />;
}

// --- Solicitudes (PATCH /solicitudes/:id/estado) -------------------------------------------

export function AccionesSolicitud({
  id,
  estado,
  tipo,
  solicitante,
  mascota,
  token,
}: {
  id: number;
  estado: string;
  /** `Adopcion` o `Transito`. */
  tipo: string;
  solicitante: string;
  mascota: string;
  token: string;
}) {
  const [comentario, setComentario] = useState("");
  const [motivo, setMotivo] = useState<MotivoRechazo | "">("");

  // El back resuelve cualquier solicitud abierta; las finales ya no se tocan.
  if (!(ESTADOS_SOLICITUD_ABIERTA as readonly string[]).includes(estado)) {
    return <AccionesConConfirmacion acciones={[]} />;
  }

  const campoComentario = (
    <label className="block text-sm font-medium text-neutral-700">
      <span className="mb-1 block">Comentario (opcional)</span>
      <textarea
        rows={3}
        maxLength={COMENTARIO_MAX}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder={`Agregá un mensaje para ${solicitante}, si querés.`}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900"
      />
      <span className="mt-1 block text-right text-xs font-normal text-neutral-400">
        {comentario.length}/{COMENTARIO_MAX}
      </span>
    </label>
  );

  const campoMotivo = (
    <label className="block text-sm font-medium text-neutral-700">
      <span className="mb-1 block">¿Por qué la rechazás?</span>
      <select
        value={motivo}
        onChange={(e) => setMotivo(e.target.value as MotivoRechazo | "")}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900"
      >
        <option value="">Elegí un motivo</option>
        {MOTIVOS_RECHAZO.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );

  // Aceptar exige haberla marcado como revisada; hasta entonces solo se puede revisar o rechazar.
  const revisar: AccionFila = {
    clave: "revisada",
    etiqueta: "Marcar revisada",
    icono: CheckCheck,
    tono: "info",
    confirmacion: {
      titulo: `¿Marcar como revisada la solicitud de ${solicitante}?`,
      mensaje: `${solicitante} va a ver que ya revisaste su solicitud sobre ${mascota}. Después podés aceptarla o rechazarla.`,
      textoConfirmar: "Marcar revisada",
    },
    exito: `Marcaste como revisada la solicitud de ${solicitante}.`,
    ejecutar: () => marcarSolicitudRevisada(id, token),
  };

  const aceptar: AccionFila = {
    clave: "aceptar",
    etiqueta: "Aceptar",
    icono: Check,
    tono: "exito",
    confirmacion: {
      titulo: `¿Aceptar a ${solicitante}?`,
      mensaje: `La solicitud sobre ${mascota} va a quedar marcada como Aprobada.`,
      detalle:
        tipo === "Adopcion"
          ? `${mascota} pasa a Adoptado, la publicación se finaliza y las demás solicitudes abiertas se cierran con un aviso. Esta acción no se puede deshacer.`
          : "Esta acción no se puede deshacer.",
      textoConfirmar: "Aceptar",
    },
    exito: `Aceptaste la solicitud de ${solicitante}.`,
    ejecutar: () => resolverSolicitud(id, "Aprobada", comentario, token),
    extra: campoComentario,
    alAbrir: () => setComentario(""),
  };

  const rechazar: AccionFila = {
    clave: "rechazar",
    etiqueta: "Rechazar",
    icono: X,
    tono: "peligro",
    confirmacion: {
      titulo: `¿Rechazar a ${solicitante}?`,
      mensaje: `La solicitud sobre ${mascota} va a quedar marcada como Rechazada.`,
      detalle: "Esta acción no se puede deshacer.",
      textoConfirmar: "Rechazar",
      peligro: true,
    },
    exito: `Rechazaste la solicitud de ${solicitante}.`,
    ejecutar: () => resolverSolicitud(id, "Rechazada", comentario, token, motivo || undefined),
    extra: (
      <div className="space-y-3">
        {campoMotivo}
        {campoComentario}
      </div>
    ),
    alAbrir: () => {
      setComentario("");
      setMotivo("");
    },
  };

  const acciones = estado === "Revisada" ? [aceptar, rechazar] : [revisar, rechazar];

  return <AccionesConConfirmacion acciones={acciones} />;
}

// --- Campañas (PATCH /refugio/campanias/:id/estado, HU-12.6/12.7 y spec 028) ---------------

export function AccionesCampania({ id, estado, token }: { id: number; estado: string; token: string }) {
  const acciones: AccionFila[] = [];

  if (estado === "Activa") {
    acciones.push({
      clave: "pausar",
      etiqueta: "Pausar",
      icono: Pause,
      tono: "neutral",
      confirmacion: {
        titulo: "¿Pausar la campaña?",
        mensaje:
          "Deja de mostrarse y de recibir donaciones hasta que la reactives. Vas a poder seguir revisando las que ya te avisaron.",
        textoConfirmar: "Pausar",
      },
      exito: "Pausaste la campaña.",
      ejecutar: () => cambiarEstadoCampania(id, "Pausada", token),
    });
  }
  if (estado === "Pausada") {
    acciones.push({
      clave: "reactivar",
      etiqueta: "Reactivar",
      icono: Play,
      tono: "exito",
      confirmacion: {
        titulo: "¿Reactivar la campaña?",
        mensaje: "Vuelve a mostrarse y a recibir donaciones. Si ya venció, se finaliza.",
        textoConfirmar: "Reactivar",
      },
      exito: "Reactivaste la campaña.",
      ejecutar: () => cambiarEstadoCampania(id, "Activa", token),
    });
  }
  if (estado === "Inactiva" || estado === "Activa" || estado === "Pausada") {
    acciones.push({
      clave: "finalizar",
      etiqueta: "Finalizar",
      icono: CircleStop,
      tono: "peligro",
      confirmacion: {
        titulo: "¿Finalizar la campaña?",
        mensaje:
          "Deja de recibir donaciones y ya no se puede editar ni reactivar. Vas a poder seguir revisando las que ya te avisaron.",
        textoConfirmar: "Finalizar",
        peligro: true,
      },
      exito: "Finalizaste la campaña.",
      ejecutar: () => cambiarEstadoCampania(id, "Finalizada", token),
    });
  }

  return <AccionesConConfirmacion acciones={acciones} />;
}
