/**
 * "Lo que sigue" después de una aprobación: tres tarjetas numeradas con lo que de verdad va
 * a pasar, no relleno. Cambia según sea una adopción o un tránsito.
 */
import { Text, View } from 'react-native';

import { SeccionTitulada } from '@/components/ui/SeccionTitulada';
import type { SolicitudDetalle } from '@/services/solicitudes';
import { aFechaVisible, parsearFecha } from '@/shared/validation/dates';

interface Paso {
  titulo: string;
  detalle: string;
}

function pasosDe(solicitud: SolicitudDetalle): Paso[] {
  const nombre = solicitud.mascota.nombre ?? 'la mascota';
  const entrega: Paso = {
    titulo: 'Coordiná la entrega por el chat',
    detalle: `Escribile a ${solicitud.publicador.nombre} para acordar cuándo y dónde.`,
  };

  if (solicitud.tipoSolicitud === 'Transito') {
    const inicio = parsearFecha(solicitud.transito?.fechaInicio);
    const fin = parsearFecha(solicitud.transito?.fechaFin);

    return [
      entrega,
      {
        titulo: 'Tu período de tránsito',
        detalle:
          inicio && fin
            ? `Del ${aFechaVisible(inicio)} al ${aFechaVisible(fin)}.`
            : `El tiempo que acordaron para cuidar a ${nombre}.`,
      },
      {
        titulo: 'Te vamos a pedir novedades',
        detalle: 'Cada pocos días te preguntamos cómo está, para que el refugio se quede tranquilo.',
      },
    ];
  }

  return [
    entrega,
    {
      titulo: 'En 2 días llega el primer seguimiento',
      detalle: 'Te vamos a preguntar cómo fue la primera noche en casa.',
    },
    ...(solicitud.mascotaAdoptadaId == null
      ? []
      : [
          {
            titulo: `${nombre} ya está en Mis mascotas`,
            detalle: 'Ahí vas a encontrar su ficha y su historia clínica.',
          },
        ]),
  ];
}

export function ProximosPasos({ solicitud }: { solicitud: SolicitudDetalle }) {
  const pasos = pasosDe(solicitud);

  return (
    <SeccionTitulada titulo="Lo que sigue" className="mt-6">
      <View className="gap-2.5">
        {pasos.map((paso, indice) => (
          <View
            key={paso.titulo}
            className="flex-row items-start gap-3.5 rounded-2xl bg-organic-surface p-4 shadow-sm"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-organic-accent-600">
              <Text className="font-cuerpo-bold text-[15px] text-white">{indice + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-cuerpo-semi text-[16px] leading-[22px] text-organic-neutral-900">
                {paso.titulo}
              </Text>
              <Text className="mt-0.5 font-cuerpo text-[14px] leading-5 text-organic-neutral-600">
                {paso.detalle}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </SeccionTitulada>
  );
}
