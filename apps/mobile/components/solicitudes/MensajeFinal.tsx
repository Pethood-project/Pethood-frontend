/**
 * Lo que lee quien pidió cuando su solicitud terminó sin ser aceptada: no aceptada, cerrada o
 * retirada. Va con el texto cuidado de cada causa (ver `mensajeDeFinal`) y, salvo cuando la
 * mascota falleció, con una salida para seguir buscando.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { CustomButton } from '@/components/CustomButton';
import { mensajeDeFinal, ofreceSeguirExplorando } from '@/constants/Solicitudes';
import { PALETA } from '@/constants/theme';
import type { EstadoSolicitudNombre, MotivoSolicitud } from '@/services/solicitudes';

interface MensajeFinalProps {
  estado: EstadoSolicitudNombre;
  motivo: MotivoSolicitud | null;
  nombreMascota: string;
}

export function MensajeFinal({ estado, motivo, nombreMascota }: MensajeFinalProps) {
  const router = useRouter();
  const texto = mensajeDeFinal(estado, motivo, nombreMascota);

  if (!texto) return null;

  return (
    <View className="rounded-2xl bg-organic-surface p-4 shadow-sm">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-organic-accent-100">
          <Ionicons
            name={motivo === 'MASCOTA_FALLECIDA' ? 'heart-outline' : 'paw-outline'}
            size={20}
            color={PALETA.accent[600]}
          />
        </View>
        <Text className="flex-1 font-cuerpo text-[15.5px] leading-[23px] text-organic-neutral-800">
          {texto}
        </Text>
      </View>

      {ofreceSeguirExplorando(motivo) ? (
        <View className="mt-4">
          <CustomButton
            title="Ver otras mascotas"
            variant="acento-borde"
            onPress={() => router.push('/(tabs)/adoptar' as Href)}
          />
        </View>
      ) : null}
    </View>
  );
}
