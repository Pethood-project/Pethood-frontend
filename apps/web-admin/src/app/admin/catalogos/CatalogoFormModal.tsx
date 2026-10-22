"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { ErrorCampo } from "@/components/ui/ErrorCampo";
import { Modal } from "@/components/ui/Modal";
import { useTocados } from "@/lib/useTocados";
import { hayErrores, LIMITES, validarEntero, validarTexto } from "@/lib/validation";
import type { BodyCatalogo, Catalogo, ItemCatalogo } from "@/types/admin-catalogos";

const INPUT = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900";

// Alta (item null) o edición. Campos según tabla de api-admin-catalogos.md; límites solo UX.
export function CatalogoFormModal({
  catalogo,
  item,
  especies,
  error,
  onCerrar,
  onGuardar,
}: {
  catalogo: Catalogo;
  item: ItemCatalogo | null;
  especies: ItemCatalogo[];
  error: string | null;
  onCerrar: () => void;
  onGuardar: (body: BodyCatalogo) => Promise<void>;
}) {
  const esEstado = catalogo.startsWith("estados-");
  const tieneNombre = !esEstado && catalogo !== "tipos-solicitud";
  const tieneDescripcion = catalogo !== "razas";
  const tieneEspecie = catalogo === "razas" && !item;
  // Vacunas (spec 029): varias especies, en alta y en edición; la descripción es obligatoria.
  const tieneEspecies = catalogo === "vacunas";
  const tieneSecuencia = catalogo === "tipos-solicitud";

  const [nombre, setNombre] = useState(item?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? "");
  const [especieId, setEspecieId] = useState("");
  // Solo las que siguen activas: una especie dada de baja no se puede volver a mandar.
  const [especieIds, setEspecieIds] = useState<number[]>(
    () => item?.especies?.map((e) => e.id).filter((id) => especies.some((e) => e.id === id)) ?? [],
  );
  const [secuencia, setSecuencia] = useState(String(item?.secuenciaDias ?? ""));
  const [enviando, setEnviando] = useState(false);

  const { ver, tocar, intentarEnviar } = useTocados();
  const L = LIMITES.catalogo;
  const errores = {
    nombre: tieneNombre ? validarTexto(nombre, { etiqueta: "El nombre", ...L.nombre }) : null,
    especie: tieneEspecie && !especieId ? "Elegí una especie para continuar." : null,
    especies: tieneEspecies && especieIds.length === 0 ? "Elegí al menos una especie para continuar." : null,
    descripcion: tieneDescripcion
      ? validarTexto(descripcion, { etiqueta: "La descripción", ...L.descripcion, obligatorio: tieneEspecies })
      : null,
    secuencia: tieneSecuencia ? validarEntero(secuencia, { etiqueta: "La secuencia", ...L.secuenciaDias }) : null,
  };

  async function guardar() {
    intentarEnviar();
    if (hayErrores(errores)) return;
    setEnviando(true);
    const body: BodyCatalogo = {};
    if (tieneNombre) body.nombre = nombre.trim();
    if (tieneDescripcion) body.descripcion = descripcion.trim();
    if (tieneEspecie) body.especieId = Number(especieId);
    if (tieneEspecies) body.especieIds = especieIds;
    if (tieneSecuencia) body.secuenciaDias = Number(secuencia);
    try {
      await onGuardar(body);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={item ? "Editar ítem" : "Nuevo ítem"} onCerrar={onCerrar}>
      <div className="space-y-3">
        {tieneNombre && (
          <CampoTexto id="nombre" label="Nombre" value={nombre} onChange={setNombre} onBlur={() => tocar("nombre")} error={ver("nombre", errores.nombre)} maxLength={L.nombre.max} />
        )}
        {tieneEspecie && (
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="especieId">
              Especie
            </label>
            <select
              id="especieId"
              className={`${INPUT} ${ver("especie", errores.especie) ? "border-red-400" : ""}`}
              value={especieId}
              onChange={(e) => setEspecieId(e.target.value)}
              onBlur={() => tocar("especie")}
              aria-invalid={!!ver("especie", errores.especie)}
            >
              <option value="">Elegí una especie</option>
              {especies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <ErrorCampo id="especieId" error={ver("especie", errores.especie)} />
          </div>
        )}
        {tieneEspecies && (
          <fieldset aria-describedby="especieIds-error" aria-invalid={!!ver("especies", errores.especies)}>
            <legend className="mb-1 block text-sm font-medium text-neutral-700">Especies</legend>
            <div className="flex flex-wrap gap-4">
              {especies.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={especieIds.includes(e.id)}
                    onChange={(ev) => {
                      tocar("especies");
                      setEspecieIds((ids) => (ev.target.checked ? [...ids, e.id] : ids.filter((id) => id !== e.id)));
                    }}
                  />
                  {e.nombre}
                </label>
              ))}
            </div>
            <ErrorCampo id="especieIds" error={ver("especies", errores.especies)} />
          </fieldset>
        )}
        {tieneDescripcion && (
          <CampoTexto id="descripcion" label="Descripción" rows={3} value={descripcion} onChange={setDescripcion} onBlur={() => tocar("descripcion")} error={ver("descripcion", errores.descripcion)} maxLength={L.descripcion.max} />
        )}
        {tieneSecuencia && (
          <CampoTexto id="secuencia" label="Secuencia (días, 1 a 365)" type="number" min={L.secuenciaDias.min} max={L.secuenciaDias.max} value={secuencia} onChange={setSecuencia} onBlur={() => tocar("secuencia")} error={ver("secuencia", errores.secuencia)} />
        )}
        {error && <Feedback tipo="error" mensaje={error} />}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
