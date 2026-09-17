/**
 * Línea de tiempo del historial de una solicitud (HU-7.3/7.4/7.5): cada estado por el que
 * ya pasó, conectado por una línea, en el orden en que ocurrió.
 *
 * No hay un paso "pendiente" inventado después del último: a diferencia de un tracking de
 * envío, acá no hay un paso siguiente fijo que prometerle al usuario (HU-7.4 puede resolver
 * directo desde "Pendiente", sin pasar por "En revisión").
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import type { EstadoSolicitudHistorial } from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

/** Llegó al final del proceso, pero no a un resultado favorable: se marca con una X, no un check. */
const DESFAVORABLE = new Set(['Rechazada', 'Cancelada']);

const ETIQUETAS: Record<string, string> = {
  Pendiente: 'Solicitud enviada',
  En_Revision: 'En revisión',
  Aprobada: 'Aprobada',
  Rechazada: 'Rechazada',
  Cancelada: 'Cancelada',
};

interface LineaTiempoEstadosProps {
  historial: EstadoSolicitudHistorial[];
}

export function LineaTiempoEstados({ historial }: LineaTiempoEstadosProps) {
  // El historial llega del más nuevo al más viejo (el primero es el estado vigente); acá
  // se recorre en el orden en que pasó, de arriba a abajo.
  const enOrden = [...historial].reverse();

  return (
    <View className="rounded-2xl bg-organic-surface p-3.5 shadow-sm">
      {enOrden.map((paso, indice) => {
        const esUltimo = indice === enOrden.length - 1;
        const negativo = DESFAVORABLE.has(paso.nombre);
        const fecha = parsearFecha(paso.fecha);

        return (
          <View key={paso.id} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={`h-6 w-6 items-center justify-center rounded-full ${
                  negativo ? 'bg-rose-500' : 'bg-organic-accent-600'
                }`}
              >
                <Ionicons name={negativo ? 'close' : 'checkmark'} size={14} color={PALETA.blanco} />
              </View>
              {esUltimo ? null : <View className="w-[2px] flex-1 bg-organic-accent-300" />}
            </View>

            <View className={esUltimo ? 'flex-1 pb-0.5' : 'flex-1 pb-4'}>
              <Text className="font-cuerpo-semi text-sm text-organic-neutral-900">
                {ETIQUETAS[paso.nombre] ?? paso.nombre.replace(/_/g, ' ')}
              </Text>
              <Text className="mt-0.5 font-cuerpo text-xs text-organic-neutral-600">
                {fecha ? aFechaVisible(fecha) : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
