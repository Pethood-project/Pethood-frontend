"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, CreditCard, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { ApiError, urlArchivo } from "@/services/api";
import type { ResumenResenas } from "@/types/admin-usuarios";

// Piezas compartidas por los modales de detalle de admin (y por el detalle del reporte).

export const Dato = ({ k, v }: { k: string; v: string | null | undefined }) =>
  v ? (
    <div className="min-w-0">
      <dt className="text-xs uppercase text-neutral-500">{k}</dt>
      <dd className="break-words text-sm text-neutral-900">{v}</dd>
    </div>
  ) : null;

export const Chips = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((i) => (
      <span key={i} className="rounded-full bg-pethood-beige px-2.5 py-0.5 text-xs text-neutral-700">
        {i}
      </span>
    ))}
  </div>
);

export const dia = (iso: string) => new Date(iso).toLocaleDateString("es-AR");
export const diaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
export const plata = (n: number | string) =>
  Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const siNo = (v: boolean | null) => (v === null ? null : v ? "Sí" : "No");

export function Estrellas({ n }: { n: number }) {
  return (
    <span className="text-amber-500">
      {"★".repeat(n)}
      <span className="text-neutral-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/** Foto grande + miniaturas para elegir. Sin fotos, un recuadro vacío en vez de un hueco. */
export function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [actual, setActual] = useState(0);
  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400">
        Sin fotos
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urlArchivo(fotos[actual])} alt={alt} className="aspect-[4/3] w-full rounded-xl object-cover" />
      {fotos.length > 1 && (
        <div className="flex gap-2">
          {fotos.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`overflow-hidden rounded-lg border-2 ${i === actual ? "border-pethood-orange" : "border-transparent opacity-70"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlArchivo(f)} alt="" className="h-10 w-10 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Avatar redondo con iniciales de respaldo. */
export function Avatar({ url, nombre }: { url: string | null; nombre: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={urlArchivo(url)} alt={nombre} className="h-16 w-16 shrink-0 rounded-full object-cover" />
  ) : (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg text-neutral-400">
      {nombre.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{titulo}</h3>
      {children}
    </div>
  );
}

export function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number | string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
      <p className="text-xs text-neutral-500">{etiqueta}</p>
      <p className="text-base font-semibold text-neutral-900">{valor}</p>
    </div>
  );
}

export function Resenas({ r }: { r: ResumenResenas }) {
  if (r.cantidad === 0) return <p className="text-sm text-neutral-500">Sin reseñas.</p>;
  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">{r.promedio?.toFixed(1)}</span>{" "}
        <Estrellas n={Math.round(r.promedio ?? 0)} /> · {r.cantidad} reseña(s)
      </p>
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {r.resenas.map((x) => (
          <li key={x.id} className="rounded-md bg-neutral-50 p-2 text-sm">
            <p className="text-xs text-neutral-500">
              <Estrellas n={x.puntuacion} /> · {x.autor.nombre} {x.autor.apellido} · {dia(x.fecha)}
            </p>
            {x.comentario && <p className="whitespace-pre-wrap text-neutral-700">{x.comentario}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pide el detalle al abrir. Cambiar `clave` (id/token) vuelve a pedir. */
export function useDetalle<T>(pedir: () => Promise<T>, clave: unknown) {
  const [estado, setEstado] = useState<{ clave: unknown; datos?: T; error?: string }>({ clave });
  useEffect(() => {
    let cancelado = false;
    pedir()
      .then((datos) => !cancelado && setEstado({ clave, datos }))
      .catch(
        (err) =>
          !cancelado &&
          setEstado({ clave, error: err instanceof ApiError ? err.message : "No pudimos cargar el detalle." }),
      );
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  const vigente = estado.clave === clave;
  return { datos: vigente ? estado.datos : undefined, error: vigente ? estado.error : undefined };
}

/** Modal de detalle: carga, error y contenido en un solo lugar. */
export function DetalleModal<T>({
  titulo,
  clave,
  pedir,
  onCerrar,
  ancho = "max-w-2xl",
  pie,
  children,
}: {
  ancho?: string;
  /** Pie fijo (ej. confirmar verificación), recibe el detalle ya cargado. */
  pie?: (datos: T) => ReactNode;
  titulo: string;
  clave: unknown;
  pedir: () => Promise<T>;
  onCerrar: () => void;
  children: (datos: T) => ReactNode;
}) {
  const { datos, error } = useDetalle(pedir, clave);
  return (
    <Modal titulo={titulo} onCerrar={onCerrar} ancho={ancho} pie={datos && pie ? pie(datos) : undefined}>
      {error && <Feedback tipo="error" mensaje={error} />}
      {!datos && !error && <p className="text-sm text-neutral-500">Cargando…</p>}
      {datos && <div className="space-y-4 text-sm text-neutral-700">{children(datos)}</div>}
    </Modal>
  );
}

export interface FotosVerificacionUsuario {
  dniFrente?: string | null;
  dniDorso?: string | null;
  selfie?: string | null;
}

const TILES: { clave: keyof FotosVerificacionUsuario; etiqueta: string; icono: LucideIcon }[] = [
  { clave: "dniFrente", etiqueta: "DNI (frente)", icono: CreditCard },
  { clave: "dniDorso", etiqueta: "DNI (dorso)", icono: CreditCard },
  { clave: "selfie", etiqueta: "Foto del usuario", icono: UserRound },
];

/** Foto ampliada sobre el modal. Cierra con click/toque, ✕ o Escape (sin cerrar el modal de abajo). */
function Ampliada({
  etiqueta,
  url,
  icono: Icono,
  onCerrar,
}: {
  etiqueta: string;
  url: string | null;
  icono: LucideIcon;
  onCerrar: () => void;
}) {
  useEffect(() => {
    // En captura y en window: corre antes que el Escape del Modal y lo frena.
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onCerrar();
    };
    window.addEventListener("keydown", alTeclear, true);
    return () => window.removeEventListener("keydown", alTeclear, true);
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
      onClick={onCerrar}
      className="animate-modal-fondo fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-3 top-3 rounded-md p-2 text-white/80 hover:bg-white/10"
      >
        ✕
      </button>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlArchivo(url)} alt={etiqueta} className="max-h-[85dvh] max-w-full rounded-lg object-contain" />
      ) : (
        <div className="flex aspect-[4/3] w-full max-w-lg flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/30 text-white/60">
          <Icono size={48} />
          <p className="text-sm">Todavía no disponible</p>
        </div>
      )}
      <p className="text-sm text-white/80">{etiqueta}</p>
    </div>
  );
}

/**
 * Las tres fotos para verificar a un usuario (DNI frente, DNI dorso y él mismo), una al lado de la
 * otra; al tocar una se amplía. Placeholders hasta que el backend exponga las URLs.
 */
export function FotosVerificacion({ fotos = {} }: { fotos?: FotosVerificacionUsuario }) {
  const [abierta, setAbierta] = useState<(typeof TILES)[number] | null>(null);
  const cerrar = useCallback(() => setAbierta(null), []);

  return (
    <Seccion titulo="Fotos de verificación">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {TILES.map((t) => {
          const url = fotos[t.clave] ?? null;
          const Icono = t.icono;
          return (
            <button key={t.clave} type="button" onClick={() => setAbierta(t)} className="group space-y-1 text-left">
              <div
                className={`flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg transition-colors ${
                  url
                    ? "bg-neutral-100"
                    : "border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 group-hover:border-pethood-orange"
                }`}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlArchivo(url)} alt={t.etiqueta} className="h-full w-full object-cover" />
                ) : (
                  <Icono size={28} />
                )}
              </div>
              <p className="text-xs text-neutral-600">{t.etiqueta}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        Tocá una foto para verla en grande.{Object.keys(fotos).length === 0 && " Todavía no disponibles."}
      </p>
      {abierta && (
        <Ampliada
          etiqueta={abierta.etiqueta}
          url={fotos[abierta.clave] ?? null}
          icono={abierta.icono}
          onCerrar={cerrar}
        />
      )}
    </Seccion>
  );
}

/** Pie del modal en modo verificación: confirma con la API y muestra el error ahí mismo. */
export function PieVerificar({ onConfirmar, onCerrar }: { onConfirmar: () => Promise<unknown>; onCerrar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos verificar. Intentá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <Feedback tipo="error" mensaje={error} />}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button tamano="chico" variant="secondary" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button tamano="chico" onClick={confirmar} disabled={enviando}>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck size={16} />
            {enviando ? "Verificando…" : "Verificar"}
          </span>
        </Button>
      </div>
    </div>
  );
}
