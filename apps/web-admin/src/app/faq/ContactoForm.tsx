"use client";

import { useState } from "react";
import { ErrorCampo } from "@/components/ui/ErrorCampo";
import { Feedback } from "@/components/ui/Feedback";
import { useTocados } from "@/lib/useTocados";
import { hayErrores, LIMITES, validarEmail, validarTexto } from "@/lib/validation";
import { ApiError } from "@/services/api";
import { enviarConsulta } from "@/services/soporte";

// HU-15.2 — formulario público. Validación acá es solo UX, la real es del backend.
export function ContactoForm() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [valores, setValores] = useState({ nombreCompleto: "", email: "", asunto: "", mensaje: "" });
  const { ver, tocar, intentarEnviar, reiniciar } = useTocados();
  const L = LIMITES.consultaSoporte;
  const errores = {
    nombreCompleto: validarTexto(valores.nombreCompleto, { etiqueta: "El nombre", ...L.nombreCompleto }),
    email: validarEmail(valores.email, true, L.email.max),
    asunto: validarTexto(valores.asunto, { etiqueta: "El asunto", ...L.asunto }),
    mensaje: validarTexto(valores.mensaje, { etiqueta: "El mensaje", ...L.mensaje }),
  };
  type Campo = keyof typeof errores;

  // Props comunes de cada campo: valor controlado, validación al salir del campo y aria.
  const props = (id: Campo) => ({
    id,
    name: id,
    value: valores[id],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValores((prev) => ({ ...prev, [id]: e.target.value })),
    onBlur: () => tocar(id),
    "aria-invalid": !!ver(id, errores[id]),
    "aria-describedby": `${id}-error`,
  });

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    intentarEnviar();
    if (hayErrores(errores)) return;
    const f = valores;
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const { mensaje } = await enviarConsulta({
        nombreCompleto: f.nombreCompleto.trim(),
        email: f.email.trim(),
        asunto: f.asunto.trim(),
        mensaje: f.mensaje.trim(),
      });
      setExito(mensaje);
      setValores({ nombreCompleto: "", email: "", asunto: "", mensaje: "" });
      reiniciar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos enviar tu consulta. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="contacto" style={{ marginTop: 48 }}>
      <h2>Contactanos</h2>
      <p className="hint">¿No encontraste lo que buscabas? Escribinos y te respondemos a la brevedad.</p>
      <form aria-label="Formulario de soporte" noValidate onSubmit={enviar} style={{ marginTop: 16 }}>
        <div className="fields">
          <div>
            <label htmlFor="nombreCompleto">Nombre completo *</label>
            <input {...props("nombreCompleto")} maxLength={L.nombreCompleto.max} autoComplete="name" />
            <ErrorCampo id="nombreCompleto" error={ver("nombreCompleto", errores.nombreCompleto)} />
          </div>
          <div>
            <label htmlFor="email">Correo electrónico de contacto *</label>
            <input {...props("email")} type="email" maxLength={L.email.max} autoComplete="email" />
            <ErrorCampo id="email" error={ver("email", errores.email)} />
          </div>
          <div className="full">
            <label htmlFor="asunto">Asunto *</label>
            <input {...props("asunto")} maxLength={L.asunto.max} />
            <ErrorCampo id="asunto" error={ver("asunto", errores.asunto)} />
          </div>
          <div className="full">
            <label htmlFor="mensaje">Mensaje *</label>
            <textarea {...props("mensaje")} rows={5} maxLength={L.mensaje.max} />
            <ErrorCampo id="mensaje" error={ver("mensaje", errores.mensaje)} />
          </div>
        </div>
        {error && <div style={{ marginTop: 16 }}><Feedback tipo="error" mensaje={error} /></div>}
        {exito && <div style={{ marginTop: 16 }}><Feedback tipo="exito" mensaje={exito} /></div>}
        <div className="actions">
          <span />
          <button type="submit" className="btn" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar Mensaje"}
          </button>
        </div>
      </form>
    </section>
  );
}
