import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { listarCategorias, listarFaqsPublicas } from "@/services/soporte";
import { FaqsAdmin } from "./FaqsAdmin";

// HU-15.3 — ABM de categorías y FAQs. No hay listado admin de FAQs: se cruza el público
// (FAQs activas) con las categorías, que incluyen las que todavía no tienen preguntas.
export default async function FaqsAdminPage() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const [categorias, publicas] = await Promise.all([listarCategorias(token), listarFaqsPublicas()]);
  const faqsPorCategoria = new Map(publicas.map((c) => [c.id, c.faqs]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Preguntas frecuentes</h1>
        <p className="text-sm text-neutral-700">Categorías y preguntas que ve el público en /faq y en la app.</p>
      </div>

      <FaqsAdmin
        token={token}
        categorias={categorias.map((c) => ({ ...c, faqs: faqsPorCategoria.get(c.id) ?? [] }))}
      />
    </div>
  );
}
