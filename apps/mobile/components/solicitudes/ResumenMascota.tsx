/**
 * Tarjeta chata con la mascota sobre la que se está solicitando. Se repite en los pasos 1,
 * 3 y 4 del formulario para que el usuario nunca pierda de vista a quién le está pidiendo.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';

interface ResumenMascotaProps {
  nombre: string | null;
  imagenUrl: string | null;
  /** Renglón de abajo: refugio y/o ubicación, ya armado por quien lo usa. */
  subtitulo?: string | null;
}

export function ResumenMascota({ nombre, imagenUrl, subtitulo }: ResumenMascotaProps) {
  const foto = urlAbsoluta(imagenUrl);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-organic-surface p-2.5">
      {/* El color va por `style` y no por clase: los tintes `calido` de la paleta tienen
          claves camelCase que no dan buenos nombres de clase. */}
      <View
        className="h-11 w-11 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: PALETA.calido.naranja }}
      >
        {foto ? (
          <Image source={{ uri: foto }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Ionicons name="paw" size={20} color={PALETA.accent[100]} />
        )}
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="font-titulo text-[15px] text-organic-neutral-900">
          {nombre ?? 'Sin nombre'}
        </Text>
        {subtitulo ? (
          <Text numberOfLines={1} className="mt-0.5 font-cuerpo text-[11.5px] text-organic-accent-500">
            {subtitulo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
