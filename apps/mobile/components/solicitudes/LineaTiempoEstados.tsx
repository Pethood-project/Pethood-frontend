/**
 * El historial de una solicitud: cada estado por el que ya pasó, conectado por una línea, en
 * el orden en que ocurrió. Va debajo del camino de estados, con el detalle que ahí no entra:
 * la fecha de cada paso y, para quien publicó, la causa de cómo terminó.
 *
 * No hay un paso "pendiente" inventado después del último: a diferencia de un tracking de
 * envío, acá el paso siguiente no es fijo (se puede rechazar desde cualquier etapa).
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { etiquetaEstadoSolicitud, type VistaSolicitud } from '@/constants/EstadosSolicitud';
import { ETIQUETA_MOTIVO } from '@/constants/Solicitudes';
import { PALETA } from '@/constants/theme';
import type { EstadoSolicitudHistorial } from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

/** Cómo se pinta cada final: la cruz roja para lo no aceptado, gris para lo que simplemente terminó. */
const ESTILO_FINAL: Record<string, { fondo: string; icono: keyof typeof Ionicons.glyphMap }> = {
  Rechazada: { fondo: 'bg-rose-500', icono: 'close' },
  Cancelada: { fondo: 'bg-organic-neutral-400', icono: 'arrow-undo' },
  Cerrada: { fondo: 'bg-organic-neutral-400', icono: 'lock-closed' },
};

interface LineaTiempoEstadosProps {
  historial: EstadoSolicitudHistorial[];
  vista?: VistaSolicitud;
}

export function LineaTiempoEstados({ historial, vista = 'adoptante' }: LineaTiempoEstadosProps) {
  // El historial llega del más nuevo al más viejo (el primero es el estado vigente); acá
  // se recorre en el orden en que pasó, de arriba a abajo.
  const enOrden = [...historial].reverse();

  return (
    <View className="rounded-2xl bg-organic-surface p-3.5 shadow-sm">
      {enOrden.map((paso, indice) => {
        const esUltimo = indice === enOrden.length - 1;
        const final = ESTILO_FINAL[paso.nombre];
        const fecha = parsearFecha(paso.fecha);
        // A quien pidió se le habla con el mensaje de la solicitud, no con una etiqueta fría.
        const causa = vista === 'refugio' && paso.motivo ? ETIQUETA_MOTIVO[paso.motivo] : null;

        return (
          <View key={paso.id} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  final?.fondo ?? 'bg-organic-accent-600'
                }`}
              >
                <Ionicons name={final?.icono ?? 'checkmark'} size={18} color={PALETA.blanco} />
              </View>
              {esUltimo ? null : <View className="w-[2px] flex-1 bg-organic-accent-300" />}
            </View>

            <View className={esUltimo ? 'flex-1 pb-0.5' : 'flex-1 pb-5'}>
              <Text className="font-cuerpo-semi text-[16px] leading-[22px] text-organic-neutral-900">
                {paso.nombre === 'Pendiente'
                  ? 'Solicitud enviada'
                  : etiquetaEstadoSolicitud(paso.nombre, vista)}
              </Text>
              <Text className="mt-0.5 font-cuerpo text-[14px] text-organic-neutral-600">
                {fecha ? aFechaVisible(fecha) : ''}
                {causa ? ` · ${causa}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
