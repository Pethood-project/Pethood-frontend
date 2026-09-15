import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { SolicitudDemorada } from "@/types/dashboard";

// spec 010 §7.7 — solicitudes Pendiente/En_Revision con 5+ días sin cambiar de estado, foto
// actual del backlog (no depende del período elegido en pantalla).
export function AlertasSolicitudes({ items }: { items: SolicitudDemorada[] }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-neutral-900">Solicitudes que necesitan atención</h2>
      {items.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} />
          Ninguna solicitud lleva más de 5 días sin respuesta.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-neutral-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
                {item.mascota}
              </span>
              <span className="font-medium text-red-600">{item.dias} días sin respuesta</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
