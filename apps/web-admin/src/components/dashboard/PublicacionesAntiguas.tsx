import { Clock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { PublicacionDemasiadoAntigua } from "@/types/dashboard";

// spec 010 §7.8 — publicaciones activas o pausadas con 60+ días publicadas, foto actual del catálogo (no
// depende del período elegido en pantalla).
export function PublicacionesAntiguas({ items }: { items: PublicacionDemasiadoAntigua[] }) {
  return (
    // Toda la tarjeta lleva al listado con el filtro especial (mismo criterio en el back).
    <Card href="/refugio/publicaciones?estado=antiguas">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Publicaciones que llevan mucho tiempo activas</h2>
        <span className="text-sm font-medium text-pethood-accent-700">Ver publicaciones antiguas</span>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 text-base text-neutral-600">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" strokeWidth={2} />
          Ninguna publicación lleva más de 60 días activa.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg border border-pethood-accent-200 bg-pethood-accent-100 px-3 py-2.5 text-base"
            >
              <span className="flex items-center gap-2 text-neutral-800">
                <Clock className="h-5 w-5 shrink-0 text-pethood-accent-600" strokeWidth={2} />
                {item.mascota}
              </span>
              <span className="font-medium text-pethood-accent-700">{item.dias} días publicada</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
