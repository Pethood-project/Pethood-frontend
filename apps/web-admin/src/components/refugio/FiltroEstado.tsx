"use client";

import { AlertTriangle, Clock, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Pagination } from "@/components/ui/Pagination";
import { useTablaAdmin } from "@/lib/useTablaAdmin";

type Opcion = {
  valor: string;
  etiqueta: string;
  /** Cuántos hay en ese estado, si se conoce (listados sin paginar). */
  cantidad?: number;
};

/** Filtro especial (alerta del dashboard): se pinta con el color e ícono de su panel. */
type Especial = Opcion & { tono: "naranja" | "rojo" };

interface FiltroEstadoProps {
  /** Ruta del listado, ej. "/refugio/solicitudes". */
  ruta: string;
  estado?: string;
  opciones: Opcion[];
  /** Opción "sin filtro". Por defecto `""` = "Todos" (sin parámetro en la URL). */
  opcionTodos?: Opcion;
  /** Filtros especiales que no son un estado del catálogo (alertas del dashboard). */
  especiales?: Especial[];
}

const BASE =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pethood-accent-600/45 active:scale-[0.97]";

const NORMAL = {
  inactivo: "border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-pethood-accent-500 hover:bg-pethood-accent-100",
  activo: "border-pethood-accent-600 bg-pethood-accent-600 text-white shadow-sm shadow-pethood-accent-600/30",
};

const ESPECIAL: Record<Especial["tono"], { inactivo: string; activo: string; icono: LucideIcon }> = {
  naranja: {
    inactivo: "border-pethood-accent-200 bg-pethood-accent-100 text-pethood-accent-700 hover:border-pethood-accent-300 hover:bg-pethood-accent-200",
    activo: "border-pethood-accent-600 bg-pethood-accent-600 text-white shadow-sm",
    icono: Clock,
  },
  rojo: {
    inactivo: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
    activo: "border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/30",
    icono: AlertTriangle,
  },
};

function Contador({ n, activo }: { n?: number; activo: boolean }) {
  if (n === undefined) return null;
  return (
    <span
      className={`min-w-5 rounded-full px-1.5 text-center text-xs font-semibold tabular-nums ${
        activo ? "bg-white/25 text-white" : "bg-neutral-900/5 text-neutral-600"
      }`}
    >
      {n}
    </span>
  );
}

// Filtro por estado de los listados del panel del refugio, como chips: todas las opciones a la
// vista y un clic para cambiar. Vive en la URL (?estado=), así el server component vuelve a
// pedir/filtrar y el dashboard enlaza directo a los filtros especiales.
export function FiltroEstado({
  ruta,
  estado,
  opciones,
  opcionTodos = { valor: "", etiqueta: "Todos" },
  especiales = [],
}: FiltroEstadoProps) {
  const actual = estado ?? "";
  const href = (valor: string) => (valor ? `${ruta}?estado=${encodeURIComponent(valor)}` : ruta);

  return (
    <nav
      aria-label="Filtrar por estado"
      className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
    >
      {[opcionTodos, ...opciones].map((o) => {
        const activo = o.valor === actual;
        return (
          <Link
            key={o.valor || "todos"}
            href={href(o.valor)}
            scroll={false}
            aria-current={activo ? "page" : undefined}
            className={`${BASE} ${activo ? NORMAL.activo : NORMAL.inactivo}`}
          >
            {o.etiqueta}
            <Contador n={o.cantidad} activo={activo} />
          </Link>
        );
      })}

      {especiales.length > 0 && <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-neutral-300" />}

      {especiales.map((o) => {
        const activo = o.valor === actual;
        const estilo = ESPECIAL[o.tono];
        const Icono = estilo.icono;
        return (
          <Link
            key={o.valor}
            href={href(o.valor)}
            scroll={false}
            aria-current={activo ? "page" : undefined}
            className={`${BASE} ${activo ? estilo.activo : estilo.inactivo}`}
          >
            <Icono className="h-4 w-4" strokeWidth={2.2} />
            {o.etiqueta}
            <Contador n={o.cantidad} activo={activo} />
          </Link>
        );
      })}
    </nav>
  );
}

/** Paginación por número de página sobre la URL (?page=), conservando el resto de filtros. */
export function PaginacionUrl({
  ruta,
  filtros,
  page,
  limit,
  total,
}: {
  ruta: string;
  filtros: object;
  page: number;
  limit: number;
  total: number;
}) {
  const { irAPagina } = useTablaAdmin(ruta, filtros);
  return <Pagination page={page} limit={limit} total={total} onCambiar={irAPagina} forma="pastilla" />;
}
