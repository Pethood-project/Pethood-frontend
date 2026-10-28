"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { logoutAction } from "@/app/actions";
import { ConfirmarModal } from "@/components/ui/ConfirmarModal";

interface BotonCerrarSesionProps {
  className?: string;
  style?: CSSProperties;
  tabIndex?: number;
  title?: string;
  children: ReactNode;
}

// Pide confirmación antes de cerrar la sesión, para que un clic errado no la corte de una.
// El modal va por portal al body: el menú mobile del Sidebar anima con `transform`, y un
// ancestro con transform vuelve relativo a él el `position: fixed` del modal.
export function BotonCerrarSesion({ className, style, tabIndex, title, children }: BotonCerrarSesionProps) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className={className}
        style={style}
        tabIndex={tabIndex}
        title={title}
      >
        {children}
      </button>
      {confirmando &&
        createPortal(
          <ConfirmarModal
            confirmacion={{
              titulo: "¿Cerrar sesión?",
              mensaje: "Vas a tener que volver a ingresar con tu correo y contraseña.",
              textoConfirmar: "Cerrar sesión",
              textoEnviando: "Cerrando…",
            }}
            onConfirmar={logoutAction}
            onCerrar={() => setConfirmando(false)}
          />,
          document.body,
        )}
    </>
  );
}
