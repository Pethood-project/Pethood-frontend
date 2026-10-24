/** Una fila de transacción pendiente de reseñar, con el CTA para abrir el modal. */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import { etiquetaFlujo, type TransaccionElegible } from '@/services/resenas';

export function FilaPendiente({
  transaccion,
  onResenar,
}: {
  transaccion: TransaccionElegible;
  onResenar: (transaccion: TransaccionElegible) => void;
}) {
  const foto = urlAbsoluta(transaccion.mascota.imagenUrl);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-organic-surface p-3 shadow-sm">
      {foto ? (
        <Image source={{ uri: foto }} className="h-14 w-14 rounded-xl" />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-organic-accent-100">
          <Ionicons name="paw-outline" size={22} color={PALETA.accent[600]} />
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Avatar
            uri={urlAbsoluta(transaccion.contraparte.imagenUrl)}
            nombre={transaccion.contraparte.nombre}
            tamanio={24}
            variante="organic"
            tono={transaccion.contraparte.tipo === 'REFUGIO' ? 'acento' : 'neutro'}
          />
          <Text numberOfLines={1} className="flex-1 font-cuerpo-semi text-[14px] text-organic-neutral-900">
            {transaccion.contraparte.nombre}
          </Text>
        </View>
        <Text numberOfLines={1} className="mt-1 font-cuerpo text-[12px] text-organic-neutral-600">
          {transaccion.mascota.nombre ?? 'Mascota'} · {etiquetaFlujo(transaccion.flujo)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Reseñar a ${transaccion.contraparte.nombre}`}
        onPress={() => onResenar(transaccion)}
        className="rounded-2xl bg-organic-accent-600 px-4 py-2.5 active:opacity-90"
      >
        <Text className="font-cuerpo-semi text-[13px] text-white">Reseñar</Text>
      </Pressable>
    </View>
  );
}
