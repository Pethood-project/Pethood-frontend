"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { ConfirmarModal } from "@/components/ui/ConfirmarModal";
import { ErrorCampo } from "@/components/ui/ErrorCampo";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useTocados } from "@/lib/useTocados";
import { hayErrores, LIMITES, validarEmail, validarImagen, validarTelefono, validarTexto } from "@/lib/validation";
import { actualizarPerfilRefugio } from "@/services/refugio";
import type { PerfilRefugio } from "@/types/refugio";

type Campo = "nombre" | "descripcion" | "provincia" | "localidad" | "calleAltura" | "telefono" | "email";

const DIRECCION: Campo[] = ["provincia", "localidad", "calleAltura"];

function inicial(perfil: PerfilRefugio): Record<Campo, string> {
  return {
    nombre: perfil.nombre,
    descripcion: perfil.descripcion ?? "",
    provincia: perfil.provincia ?? "",
    localidad: perfil.localidad ?? "",
    calleAltura: perfil.calleAltura ?? "",
    telefono: perfil.telefono ?? "",
    email: perfil.email ?? "",
  };
}

function validar(form: Record<Campo, string>, imagen: File | null): Record<Campo | "imagen", string | null> {
  // El back geocodifica la dirección solo si llegan los tres campos: a medias no se ubica.
  const algunaDireccion = DIRECCION.some((c) => form[c].trim());
  const faltaDireccion = (c: Campo) =>
    algunaDireccion && !form[c].trim() ? "Completá provincia, localidad y calle para ubicar al refugio." : null;

  return {
    nombre: validarTexto(form.nombre, { etiqueta: "El nombre del refugio", ...LIMITES.refugio.nombre }),
    descripcion: validarTexto(form.descripcion, { etiqueta: "La descripción", max: LIMITES.refugio.descripcion.max, obligatorio: false }),
    provincia: faltaDireccion("provincia") ?? validarTexto(form.provincia, { etiqueta: "La provincia", max: LIMITES.refugio.provincia.max, obligatorio: false }),
    localidad: faltaDireccion("localidad") ?? validarTexto(form.localidad, { etiqueta: "La localidad", max: LIMITES.refugio.localidad.max, obligatorio: false }),
    calleAltura: faltaDireccion("calleAltura") ?? validarTexto(form.calleAltura, { etiqueta: "La calle y altura", max: LIMITES.refugio.calleAltura.max, obligatorio: false }),
    telefono: validarTelefono(form.telefono, false),
    email: validarEmail(form.email, false),
    imagen: validarImagen(imagen),
  };
}

// GUI-26 — edición de los datos públicos del refugio (`PATCH /refugio/perfil`, spec 017). Los
// mismos campos que «Datos del refugio» en la app, sin el mapa (la ubicación se busca por
// dirección: no hay SDK de mapas en la UI).
export function EditarPerfilRefugio({ perfil, token }: { perfil: PerfilRefugio; token: string }) {
  const router = useRouter();
  const toast = useToast();
  const { ver, tocar, intentarEnviar, reiniciar } = useTocados();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [form, setForm] = useState(() => inicial(perfil));
  const [imagen, setImagen] = useState<File | null>(null);

  const errores = validar(form, imagen);
  const set = (campo: Campo) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));
  const campo = (id: Campo, label: string, extra: { rows?: number; maxLength?: number; type?: string } = {}) => (
    <CampoTexto id={id} label={label} value={form[id]} onChange={set(id)} onBlur={() => tocar(id)} error={ver(id, errores[id])} {...extra} />
  );

  function abrir() {
    setForm(inicial(perfil));
    setImagen(null);
    reiniciar();
    setAbierto(true);
  }

  function guardar() {
    intentarEnviar();
    if (!hayErrores(errores)) setConfirmando(true);
  }

  async function enviar() {
    const cambioDireccion = DIRECCION.some((c) => form[c].trim() !== (perfil[c] ?? ""));
    const datos = new FormData();
    for (const [clave, valor] of Object.entries(form)) datos.set(clave, valor.trim());
    // Una dirección nueva todavía no fue confirmada en el mapa de la app.
    datos.set("ubicacionVerificada", String(cambioDireccion ? false : perfil.ubicacionVerificada));
    if (imagen) datos.set("imagen", imagen);

    await actualizarPerfilRefugio(datos, token);
    setConfirmando(false);
    setAbierto(false);
    toast("Guardaste los datos del refugio.");
    router.refresh();
  }

  return (
    <>
      <Button tamano="chico" forma="pastilla" onClick={abrir}>
        <Pencil className="h-4 w-4" /> Editar datos
      </Button>

      {abierto && (
        <Modal
          titulo="Editar perfil público"
          ancho="max-w-2xl"
          onCerrar={() => setAbierto(false)}
          pie={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" tamano="chico" forma="pastilla" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button tamano="chico" forma="pastilla" onClick={guardar}>
                Guardar cambios
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{campo("nombre", "Nombre del refugio *", { maxLength: LIMITES.refugio.nombre.max })}</div>
            <div className="sm:col-span-2">
              {campo("descripcion", "Descripción", { rows: 4, maxLength: LIMITES.refugio.descripcion.max })}
            </div>
            {campo("provincia", "Provincia", { maxLength: LIMITES.refugio.provincia.max })}
            {campo("localidad", "Localidad", { maxLength: LIMITES.refugio.localidad.max })}
            <div className="sm:col-span-2">{campo("calleAltura", "Calle y altura", { maxLength: LIMITES.refugio.calleAltura.max })}</div>
            {campo("telefono", "Teléfono", { type: "tel", maxLength: 20 })}
            {campo("email", "Correo", { type: "email", maxLength: 100 })}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="imagen">
                Foto del refugio
              </label>
              <input
                id="imagen"
                type="file"
                accept={LIMITES.imagen.formatos.join(",")}
                onChange={(e) => {
                  setImagen(e.target.files?.[0] ?? null);
                  tocar("imagen");
                }}
                className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
              />
              <p className="mt-1 text-xs text-neutral-500">JPG, PNG o WEBP de hasta 5 MB. Si no elegís una, queda la actual.</p>
              <ErrorCampo id="imagen" error={ver("imagen", errores.imagen)} />
            </div>
          </div>
        </Modal>
      )}

      {confirmando && (
        <ConfirmarModal
          confirmacion={{
            titulo: "¿Guardar los cambios del perfil?",
            mensaje: "Vas a modificar los datos públicos de tu refugio. Los adoptantes van a ver la información nueva.",
            detalle: DIRECCION.some((c) => form[c].trim() !== (perfil[c] ?? ""))
              ? "Cambiaste la dirección: vamos a ubicar al refugio de nuevo y vas a tener que confirmar el mapa desde la app."
              : undefined,
            textoConfirmar: "Guardar",
          }}
          onConfirmar={enviar}
          onCerrar={() => setConfirmando(false)}
        />
      )}
    </>
  );
}
