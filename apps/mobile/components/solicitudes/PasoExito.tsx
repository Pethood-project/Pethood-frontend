/**
 * GUI-7.1.2 — el cierre del formulario: la solicitud ya está creada y en estado
 * "Pendiente".
 *
 * Es una pantalla completa y no un toast a propósito: cerrar cuatro pasos de formulario
 * con un aviso de tres segundos deja al usuario sin saber si se envió, y acá además hay
 * dos cosas por hacer (ver la solicitud o volver al listado).
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { CustomButton } from '@/components/CustomButton';
import { PALETA } from '@/constants/theme';
import type { SolicitudDetalle } from '@/services/solicitudes';
import { horaVisible, parsearFecha } from '@/shared/validation/dates';

import { ResumenMascota } from './ResumenMascota';
import type { MascotaDeSolicitud } from './borrador';

interface PasoExitoProps {
  solicitud: SolicitudDetalle;
  mascota: MascotaDeSolicitud;
  onVerSolicitud: () => void;
  onVolver: () => void;
}

/** "Enviada hoy · 9:41", con la hora que devolvió el servidor. */
function enviadaEnTexto(fechaAlta: string): string {
  const fecha = parsearFecha(fechaAlta);
  return fecha ? `Enviada hoy · ${horaVisible(fecha)}` : 'Enviada recién';
}

export function PasoExito({ solicitud, mascota, onVerSolicitud, onVolver }: PasoExitoProps) {
  const destinatario = mascota.destinatario ?? 'el refugio';

  return (
    <View className="flex-1 px-6 pb-4">
      <View className="flex-1 items-center justify-center gap-5">
        {/* Halo claro alrededor del disco. El color va por `style` y no por clase: los
            tintes `calido` de la paleta tienen claves camelCase. */}
        <View
          className="h-[150px] w-[150px] items-center justify-center rounded-full"
          style={{ backgroundColor: PALETA.calido.amarilloClaro }}
        >
          <View className="h-[100px] w-[100px] items-center justify-center rounded-full bg-organic-accent-600">
            <Ionicons name="checkmark" size={52} color={PALETA.blanco} />
          </View>
        </View>

        <View className="items-center gap-2">
          <Text className="font-titulo text-[26px] text-organic-accent-600">¡Listo!</Text>
          <Text className="text-center font-cuerpo text-[13.5px] leading-5 text-organic-neutral-700">
            Enviamos tu solicitud a{' '}
            <Text className="font-cuerpo-bold text-organic-neutral-800">{destinatario}</Text>.
            Suelen responder dentro de 48 horas.
          </Text>
        </View>

        <View className="w-full">
          <ResumenMascota
            nombre={`${mascota.nombre ?? 'Sin nombre'} · Solicitud #${solicitud.id}`}
            imagenUrl={mascota.imagenUrl}
            subtitulo={enviadaEnTexto(solicitud.fechaAlta)}
          />
        </View>
      </View>

      <View className="gap-2.5">
        <CustomButton title="Ver mi solicitud" variant="acento" onPress={onVerSolicitud} />
        <CustomButton title="Volver" variant="neutro" onPress={onVolver} />
      </View>
    </View>
  );
}
