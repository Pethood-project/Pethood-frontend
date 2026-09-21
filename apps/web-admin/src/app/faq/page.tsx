import type { Metadata } from "next";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { listarFaqsPublicas } from "@/services/soporte";
import type { CategoriaPublica } from "@/types/soporte";
import { ContactoForm } from "./ContactoForm";

export const metadata: Metadata = { title: "PetHood — Preguntas frecuentes" };

// HU-15.1 — FAQs desde el backend, agrupadas por categoría, en acordeón nativo (<details>).
export default async function FaqPage() {
  let categorias: CategoriaPublica[] = [];
  let fallo = false;
  try {
    categorias = await listarFaqsPublicas();
  } catch {
    fallo = true;
  }

  return (
    <div className="lp">
      <SiteHeader />
      <main className="wrap page">
        <h1>Preguntas frecuentes</h1>
        {fallo && <p>No pudimos cargar las preguntas frecuentes. Probá de nuevo en unos minutos.</p>}
        {!fallo && categorias.length === 0 && <p>Todavía no hay preguntas frecuentes.</p>}
        {categorias.map((cat) => (
          <section key={cat.id} style={{ marginTop: 32 }}>
            <h2>{cat.nombre}</h2>
            {cat.descripcion && <p className="hint">{cat.descripcion}</p>}
            <div className="faq">
              {cat.faqs.map((f) => (
                <details key={f.id}>
                  <summary>{f.pregunta}</summary>
                  {/* Texto plano (spec 015 §6.11): React escapa, pre-line respeta saltos. */}
                  <p style={{ whiteSpace: "pre-line" }}>{f.respuesta}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <ContactoForm />
      </main>
      <SiteFooter />
    </div>
  );
}
