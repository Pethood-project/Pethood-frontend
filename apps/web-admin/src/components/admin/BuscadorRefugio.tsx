"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { listarRefugios, obtenerRefugio } from "@/services/admin-usuarios";
import type { RefugioAdmin } from "@/types/admin-usuarios";

const DEBOUNCE_MS = 300;

// Selector con búsqueda para asignar refugioId al agregar el rol Refugio (HU-2.1) —
// reemplaza el input numérico crudo, que obligaba al admin a saber el ID de memoria.
export function BuscadorRefugio({
  token,
  refugioId,
  onSeleccionar,
}: {
  token: string;
  refugioId: number | null;
  onSeleccionar: (refugio: RefugioAdmin | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<RefugioAdmin[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Precarga el nombre del refugio ya asignado (ej. al abrir el modal de roles de un
  // miembro existente) — sin esto el input queda vacío aunque ya haya un refugioId.
  useEffect(() => {
    if (!refugioId) return;
    obtenerRefugio(refugioId, token)
      .then((detalle) => setQuery(detalle.refugio.nombre))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function cerrarSiClickAfuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarSiClickAfuera);
    return () => document.removeEventListener("mousedown", cerrarSiClickAfuera);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const timeout = setTimeout(() => {
      listarRefugios({ q: query || undefined, limit: 10 }, token)
        .then((lista) => setResultados(lista.refugios))
        .catch(() => setResultados([]))
        .finally(() => setCargando(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, abierto, token]);

  return (
    <div ref={contenedorRef} className="relative">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onFocus={() => {
            setAbierto(true);
            setCargando(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setAbierto(true);
            setCargando(true);
            if (refugioId) onSeleccionar(null);
          }}
          placeholder={refugioId ? `Refugio #${refugioId} seleccionado` : "Buscar refugio por nombre…"}
          className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-8 pr-3 text-sm text-neutral-900"
        />
      </div>

      {abierto && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-md">
          {cargando && <p className="px-3 py-2 text-sm text-neutral-400">Buscando…</p>}
          {!cargando && resultados.length === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-400">Sin resultados.</p>
          )}
          {!cargando &&
            resultados.map((refugio) => (
              <button
                key={refugio.id}
                type="button"
                onClick={() => {
                  onSeleccionar(refugio);
                  setQuery(refugio.nombre);
                  setAbierto(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-pethood-beige"
              >
                {refugio.nombre}
                <span className="ml-1 text-xs text-neutral-400">#{refugio.id}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
