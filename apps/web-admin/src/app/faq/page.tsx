import type { Metadata } from "next";
import { Foto, type FotoData } from "@/components/landing/Foto";
import { FOTO_FAQ_GATO, FOTO_FAQ_GOLDEN } from "@/components/landing/fotos";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { listarFaqsPublicas } from "@/services/soporte";
import type { CategoriaPublica } from "@/types/soporte";
import { ContactoForm } from "./ContactoForm";

// Fotos de la página, en orden: cada una acompaña a `grupos` categorías seguidas y alterna de lado.
// El resto de las categorías (y el formulario de contacto) van a ancho completo.
const FOTOS = [
  { foto: FOTO_FAQ_GATO, grupos: 1 },
  { foto: FOTO_FAQ_GOLDEN, grupos: 2 },
];

export const metadata: Metadata = { title: "PetHood — Preguntas frecuentes" };

// Reparte las categorías entre las fotos (en orden) y deja el resto sin foto.
function segmentar(categorias: CategoriaPublica[]) {
  const segmentos: { foto?: FotoData; categorias: CategoriaPublica[] }[] = [];
  let desde = 0;
  for (const { foto, grupos } of FOTOS) {
    if (desde >= categorias.length) break;
    segmentos.push({ foto, categorias: categorias.slice(desde, desde + grupos) });
    desde += grupos;
  }
  if (desde < categorias.length) segmentos.push({ categorias: categorias.slice(desde) });
  return segmentos;
}

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
        {segmentar(categorias).map((seg, i) => {
          const grupos = seg.categorias.map((cat) => (
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
          ));
          if (!seg.foto) return grupos;
          return (
            <div key={i} className={`con-foto${i % 2 ? " izquierda" : ""}`}>
              {grupos}
              <aside className={seg.categorias.length > 1 ? "alta" : undefined} style={{ "--filas": seg.categorias.length } as React.CSSProperties}>
                <Foto {...seg.foto} />
              </aside>
            </div>
          );
        })}
        <ContactoForm />
      </main>
      <SiteFooter />
    </div>
  );
}
