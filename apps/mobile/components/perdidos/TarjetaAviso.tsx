/**
 * Tarjeta de la grilla del portal de mascotas perdidas (GUI-06, pantalla 06 del diseño).
 *
 * Como en el diseño, muestra lo justo para reconocer al animal: foto con el estado encima,
 * nombre y "especie · hace cuánto". La descripción, el lugar y el botón para escribirle a
 * quien lo publicó van en el popup de detalle (pantalla 6b), que se abre al tocarla.
 *
 * En un aviso resuelto, debajo del subtítulo va "Volvió con su dueño" (HU-13.2): el badge de
 * la foto dice el estado y esta línea dice qué pasó, que es lo que pide la HU.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { EstadoAnimalPerdidoBadge } from '@/components/ui/EstadoAnimalPerdidoBadge';
import { LEYENDA_RESUELTO } from '@/constants/EstadosAnimalPerdido';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import { estaResuelto, type AvisoPerdido } from '@/services/animalesPerdidos';
import { antiguedadEnDias } from '@/shared/validation/dates';

/** "Perro · Ayer". Los avisos anteriores a HU-13.1 pueden no tener especie. */
export function subtituloAviso(aviso: AvisoPerdido): string {
  const antiguedad = antiguedadEnDias(new Date(aviso.fechaAlta));
  return aviso.especie ? `${aviso.especie.nombre} · ${antiguedad}` : antiguedad;
}

interface TarjetaAvisoProps {
  aviso: AvisoPerdido;
  onPress: () => void;
}

export function TarjetaAviso({ aviso, onPress }: TarjetaAvisoProps) {
  const foto = urlAbsoluta(aviso.imagenUrl);
  const nombre = aviso.nombre ?? 'Sin nombre';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nombre}, ${aviso.estado.nombre}. Ver el aviso`}
      onPress={onPress}
      className="flex-1 overflow-hidden rounded-[20px] bg-organic-surface active:opacity-90"
    >
      <View className="w-full bg-organic-neutral-200" style={{ aspectRatio: 5 / 4 }}>
        {foto ? (
          <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="paw-outline" size={36} color={PALETA.neutral[400]} />
          </View>
        )}

        <View className="absolute left-2 top-2">
          <EstadoAnimalPerdidoBadge estado={aviso.estado.nombre} />
        </View>
      </View>

      <View className="px-3 pb-3 pt-2.5">
        <Text numberOfLines={1} className="font-cuerpo-bold text-[16px] text-organic-neutral-900">
          {nombre}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-cuerpo text-[13px] text-organic-neutral-600">
          {subtituloAviso(aviso)}
        </Text>

        {estaResuelto(aviso) ? (
          <View className="mt-1.5 flex-row items-center gap-1">
            <Ionicons name="heart-circle" size={14} color={PALETA.accent[600]} />
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 font-cuerpo-bold text-[12px] text-organic-accent-700"
            >
              {LEYENDA_RESUELTO}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
