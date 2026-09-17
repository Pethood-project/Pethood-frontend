import { Clock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { PublicacionDemasiadoAntigua } from "@/types/dashboard";

// spec 010 §7.8 — publicaciones vigentes con 60+ días publicadas, foto actual del catálogo (no
// depende del período elegido en pantalla).
export function PublicacionesAntiguas({ items }: { items: PublicacionDemasiadoAntigua[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-neutral-900">Publicaciones que llevan mucho tiempo activas</h2>
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
              className="flex items-center justify-between gap-2 rounded-lg bg-orange-50 px-3 py-2.5 text-base"
            >
              <span className="flex items-center gap-2 text-neutral-800">
                <Clock className="h-5 w-5 shrink-0 text-pethood-orange" strokeWidth={2} />
                {item.mascota}
              </span>
              <span className="font-medium text-pethood-orange-dark">{item.dias} días publicada</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
