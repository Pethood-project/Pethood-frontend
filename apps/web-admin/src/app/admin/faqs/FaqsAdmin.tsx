"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AccionButton } from "@/components/ui/AccionButton";
import { Button } from "@/components/ui/Button";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { Feedback } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useTocados } from "@/lib/useTocados";
import { hayErrores, LIMITES, validarEntero, validarTexto } from "@/lib/validation";
import { ApiError } from "@/services/api";
import { bajaCategoria, bajaFaq, crearCategoria, crearFaq, editarCategoria, editarFaq } from "@/services/soporte";
import type { Categoria, FaqPublica } from "@/types/soporte";

type CategoriaConFaqs = Categoria & { faqs: FaqPublica[] };

// Un solo modal para las cuatro altas/ediciones; `baja` pide confirmación.
type Dialogo =
  | { tipo: "categoria"; editando?: Categoria }
  | { tipo: "faq"; editando?: FaqPublica; categoriaId: number }
  | { tipo: "baja"; titulo: string; ejecutar: () => Promise<unknown> };

const INPUT = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900";
const LABEL = "mb-1 block text-sm font-medium text-neutral-700";

export function FaqsAdmin({ categorias, token }: { categorias: CategoriaConFaqs[]; token: string }) {
  const router = useRouter();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function ejecutar(accion: () => Promise<unknown>, mensajeExito: string) {
    setError(null);
    setExito(null);
    try {
      await accion();
      setExito(mensajeExito);
      setDialogo(null);
      router.refresh();
    } catch (err) {
      // El error se muestra en la página (el modal se cierra) — 409 CATEGORIA_CON_FAQS incluido.
      setError(err instanceof ApiError ? err.message : "No pudimos completar la acción. Intentá de nuevo.");
      setDialogo(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Preguntas frecuentes</h1>
          <p className="text-sm text-neutral-700">Categorías y preguntas que ve el público en /faq y en la app.</p>
        </div>
        <Button onClick={() => setDialogo({ tipo: "categoria" })}>Nueva categoría</Button>
      </div>

      {error && <Feedback tipo="error" mensaje={error} />}
      {exito && <Feedback tipo="exito" mensaje={exito} />}

      {categorias.length === 0 && (
        <p className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          Todavía no hay categorías. Creá una para empezar.
        </p>
      )}

      {categorias.map((cat) => (
        <section key={cat.id} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-neutral-900">{cat.nombre}</h2>
              {cat.descripcion && <p className="text-sm text-neutral-600">{cat.descripcion}</p>}
            </div>
            <div className="flex gap-2">
              <AccionButton icono={Plus} tono="exito" onClick={() => setDialogo({ tipo: "faq", categoriaId: cat.id })}>
                Pregunta
              </AccionButton>
              <AccionButton icono={Pencil} tono="neutral" onClick={() => setDialogo({ tipo: "categoria", editando: cat })}>
                Editar
              </AccionButton>
              <AccionButton
                icono={Trash2}
                tono="peligro"
                onClick={() =>
                  setDialogo({
                    tipo: "baja",
                    titulo: `Dar de baja la categoría "${cat.nombre}"`,
                    ejecutar: () => ejecutar(() => bajaCategoria(cat.id, token), "Categoría dada de baja."),
                  })
                }
              >
                Dar de baja
              </AccionButton>
            </div>
          </div>

          {cat.faqs.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin preguntas activas (no se muestra al público).</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {cat.faqs.map((faq) => (
                <li key={faq.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      <span className="text-neutral-400">#{faq.orden}</span> {faq.pregunta}
                    </p>
                    <p className="line-clamp-2 whitespace-pre-wrap text-sm text-neutral-600">{faq.respuesta}</p>
                  </div>
                  <div className="flex gap-2">
                    <AccionButton
                      icono={Pencil}
                      tono="neutral"
                      onClick={() => setDialogo({ tipo: "faq", editando: faq, categoriaId: cat.id })}
                    >
                      Editar
                    </AccionButton>
                    <AccionButton
                      icono={Trash2}
                      tono="peligro"
                      onClick={() =>
                        setDialogo({
                          tipo: "baja",
                          titulo: "Dar de baja la pregunta",
                          ejecutar: () => ejecutar(() => bajaFaq(faq.id, token), "Pregunta dada de baja."),
                        })
                      }
                    >
                      Dar de baja
                    </AccionButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {dialogo?.tipo === "categoria" && (
        <CategoriaForm
          editando={dialogo.editando}
          onCerrar={() => setDialogo(null)}
          onGuardar={(body) =>
            dialogo.editando
              ? ejecutar(() => editarCategoria(dialogo.editando!.id, body, token), "Categoría actualizada.")
              : ejecutar(() => crearCategoria(body, token), "Categoría creada.")
          }
        />
      )}

      {dialogo?.tipo === "faq" && (
        <FaqForm
          editando={dialogo.editando}
          categorias={categorias}
          categoriaId={dialogo.categoriaId}
          onCerrar={() => setDialogo(null)}
          onGuardar={(body) =>
            dialogo.editando
              ? ejecutar(() => editarFaq(dialogo.editando!.id, body, token), "Pregunta actualizada.")
              : ejecutar(() => crearFaq(body, token), "Pregunta creada.")
          }
        />
      )}

      {dialogo?.tipo === "baja" && (
        <Modal titulo={dialogo.titulo} onCerrar={() => setDialogo(null)}>
          <p className="mb-4 text-sm text-neutral-700">Deja de mostrarse al público. ¿Confirmás?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialogo(null)}>
              Cancelar
            </Button>
            <Button onClick={() => dialogo.ejecutar()}>Confirmar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Validación acá es solo UX (límites de spec 015 §3); el backend re-valida.
function CategoriaForm({
  editando,
  onCerrar,
  onGuardar,
}: {
  editando?: Categoria;
  onCerrar: () => void;
  onGuardar: (body: { nombre: string; descripcion?: string }) => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState(editando?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(editando?.descripcion ?? "");
  const { ver, tocar, intentarEnviar } = useTocados();
  const L = LIMITES.faqCategoria;
  const errores = {
    nombre: validarTexto(nombre, { etiqueta: "El nombre", ...L.nombre }),
    descripcion: validarTexto(descripcion, { etiqueta: "La descripción", ...L.descripcion, obligatorio: false }),
  };

  return (
    <Modal titulo={editando ? "Editar categoría" : "Nueva categoría"} onCerrar={onCerrar}>
      <form
        noValidate
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          intentarEnviar();
          if (hayErrores(errores)) return;
          setEnviando(true);
          await onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim() });
          setEnviando(false);
        }}
      >
        <CampoTexto id="nombre" label="Nombre" value={nombre} onChange={setNombre} onBlur={() => tocar("nombre")} error={ver("nombre", errores.nombre)} maxLength={L.nombre.max} />
        <CampoTexto id="descripcion" label="Descripción (opcional)" rows={2} value={descripcion} onChange={setDescripcion} onBlur={() => tocar("descripcion")} error={ver("descripcion", errores.descripcion)} maxLength={L.descripcion.max} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function FaqForm({
  editando,
  categorias,
  categoriaId,
  onCerrar,
  onGuardar,
}: {
  editando?: FaqPublica;
  categorias: Categoria[];
  categoriaId: number;
  onCerrar: () => void;
  onGuardar: (body: { pregunta: string; respuesta: string; orden: number; faqCategoriaId: number }) => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);
  const [pregunta, setPregunta] = useState(editando?.pregunta ?? "");
  const [respuesta, setRespuesta] = useState(editando?.respuesta ?? "");
  const [orden, setOrden] = useState(String(editando?.orden ?? 1));
  const [faqCategoriaId, setFaqCategoriaId] = useState(String(categoriaId));
  const { ver, tocar, intentarEnviar } = useTocados();
  const L = LIMITES.faq;
  const errores = {
    pregunta: validarTexto(pregunta, { etiqueta: "La pregunta", ...L.pregunta }),
    respuesta: validarTexto(respuesta, { etiqueta: "La respuesta", ...L.respuesta }),
    orden: validarEntero(orden, { etiqueta: "El orden", ...L.orden }),
  };

  return (
    <Modal titulo={editando ? "Editar pregunta" : "Nueva pregunta"} onCerrar={onCerrar}>
      <form
        noValidate
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          intentarEnviar();
          if (hayErrores(errores)) return;
          setEnviando(true);
          await onGuardar({
            pregunta: pregunta.trim(),
            respuesta: respuesta.trim(),
            orden: Number(orden),
            faqCategoriaId: Number(faqCategoriaId),
          });
          setEnviando(false);
        }}
      >
        <div>
          <label className={LABEL} htmlFor="faqCategoriaId">Categoría</label>
          <select id="faqCategoriaId" name="faqCategoriaId" value={faqCategoriaId} onChange={(e) => setFaqCategoriaId(e.target.value)} className={INPUT}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <CampoTexto id="pregunta" label="Pregunta" value={pregunta} onChange={setPregunta} onBlur={() => tocar("pregunta")} error={ver("pregunta", errores.pregunta)} maxLength={L.pregunta.max} />
        <CampoTexto id="respuesta" label="Respuesta (texto plano)" rows={5} value={respuesta} onChange={setRespuesta} onBlur={() => tocar("respuesta")} error={ver("respuesta", errores.respuesta)} maxLength={L.respuesta.max} />
        <CampoTexto id="orden" label="Orden" type="number" min={L.orden.min} max={L.orden.max} value={orden} onChange={setOrden} onBlur={() => tocar("orden")} error={ver("orden", errores.orden)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
