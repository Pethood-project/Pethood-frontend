/**
 * Barra de 3 segmentos bajo la tarjeta de una solicitud (GUI-27): enviada, en revisión,
 * resuelta. Mismo patrón visual que los segmentos de `BarraPasos` (relleno vs. hueco).
 *
 * Son 3 pasos y no 4 porque el dominio no tiene un paso fijo de "Visita / Entrevista": lo
 * único que existe siempre es enviar, que el refugio la revise y que se resuelva.
 */
import { View } from 'react-native';

import type { EstadoSolicitudNombre } from '@/services/solicitudes';

const POSICION: Record<EstadoSolicitudNombre, number> = {
  Pendiente: 1,
  En_Revision: 2,
  Aprobada: 3,
  Rechazada: 3,
  Cancelada: 3,
};

/** Llegó al final del proceso, pero no a un resultado favorable: se pinta distinto. */
const DESFAVORABLE: EstadoSolicitudNombre[] = ['Rechazada', 'Cancelada'];

interface ProgresoSolicitudProps {
  estado: EstadoSolicitudNombre;
}

export function ProgresoSolicitud({ estado }: ProgresoSolicitudProps) {
  const relleno = POSICION[estado] ?? 1;
  const colorRelleno = DESFAVORABLE.includes(estado)
    ? 'bg-organic-neutral-400'
    : 'bg-organic-accent-600';

  return (
    <View className="mt-2 flex-row gap-1.5">
      {[1, 2, 3].map((paso) => (
        <View
          key={paso}
          className={`h-1 flex-1 rounded-full ${
            paso <= relleno ? colorRelleno : 'bg-organic-neutral-200'
          }`}
        />
      ))}
    </View>
  );
}
