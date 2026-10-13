/**
 * Tarjeta del portal de campañas del adoptante (GUI-13, pantalla 13 del diseño): imagen,
 * refugio, título, descripción, «Recaudado · Meta», barra con porcentaje y «Donar ahora».
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { BarraProgreso } from '@/components/campanias/BarraProgreso';
import { PALETA } from '@/constants/theme';
import { formatearPesos } from '@/lib/campanias';
import { urlAbsoluta } from '@/services/api';
import type { Campania } from '@/services/campanias';

interface TarjetaCampaniaProps {
  campania: Campania;
  onDonar: () => void;
}

export function TarjetaCampania({ campania, onDonar }: TarjetaCampaniaProps) {
  const imagen = urlAbsoluta(campania.imagenUrl);

  return (
    <View className="overflow-hidden rounded-[24px] bg-organic-surface">
      <View className="w-full bg-organic-neutral-200" style={{ aspectRatio: 16 / 9 }}>
        {imagen ? (
          <Image source={{ uri: imagen }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="gift-outline" size={36} color={PALETA.neutral[400]} />
          </View>
        )}
      </View>

      <View className="gap-2 px-4 pb-4 pt-3">
        <Text className="font-cuerpo-bold text-[12px] uppercase tracking-[1px] text-organic-accent-600">
          {campania.refugio.nombre}
        </Text>
        <Text className="font-titulo text-[20px] leading-[24px] text-organic-neutral-900">
          {campania.titulo}
        </Text>
        <Text
          numberOfLines={3}
          className="font-cuerpo text-[14px] leading-[19px] text-organic-neutral-600"
        >
          {campania.descripcion}
        </Text>

        <View className="mt-1 flex-row justify-between">
          <Text className="font-cuerpo-bold text-[14px] text-organic-neutral-900">
            Recaudado: {formatearPesos(campania.recaudado)}
          </Text>
          <Text className="font-cuerpo text-[14px] text-organic-neutral-600">
            Meta: {formatearPesos(campania.objetivo)}
          </Text>
        </View>
        <BarraProgreso porcentaje={campania.porcentaje} />
        <Text className="font-cuerpo text-[13px] text-organic-neutral-600">
          {campania.porcentaje}% completado
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Donar a ${campania.titulo}`}
          onPress={onDonar}
          className="mt-2 items-center rounded-full bg-organic-accent-600 py-3 active:opacity-90"
        >
          <Text className="font-cuerpo-bold text-[16px] text-white">Donar ahora</Text>
        </Pressable>
      </View>
    </View>
  );
}
