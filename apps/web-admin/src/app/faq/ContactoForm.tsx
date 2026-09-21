"use client";

import { useState } from "react";
import { Feedback } from "@/components/ui/Feedback";
import { ApiError } from "@/services/api";
import { enviarConsulta } from "@/services/soporte";

// HU-15.2 — formulario público. Validación acá es solo UX, la real es del backend.
export function ContactoForm() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const { mensaje } = await enviarConsulta({
        nombreCompleto: String(f.get("nombreCompleto")),
        email: String(f.get("email")),
        asunto: String(f.get("asunto")),
        mensaje: String(f.get("mensaje")),
      });
      setExito(mensaje);
      form.reset();
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
      <form aria-label="Formulario de soporte" onSubmit={enviar} style={{ marginTop: 16 }}>
        <div className="fields">
          <div>
            <label htmlFor="nombreCompleto">Nombre completo *</label>
            <input id="nombreCompleto" name="nombreCompleto" required minLength={2} maxLength={100} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="email">Correo electrónico de contacto *</label>
            <input id="email" name="email" type="email" required maxLength={100} autoComplete="email" />
          </div>
          <div className="full">
            <label htmlFor="asunto">Asunto *</label>
            <input id="asunto" name="asunto" required minLength={5} maxLength={100} />
          </div>
          <div className="full">
            <label htmlFor="mensaje">Mensaje *</label>
            <textarea id="mensaje" name="mensaje" rows={5} required minLength={10} maxLength={1000} />
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
