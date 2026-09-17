/**
 * Tarjeta de una mascota en el mazo de adopción.
 *
 * Es solo presentación: no sabe de gestos ni de decisiones. La foto ocupa todo el
 * contenedor y el texto se apoya en una banda oscura abajo, para que se lea encima de
 * cualquier imagen.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { resumenMascota } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { PublicacionFeed } from '@/services/publicaciones';

/** Cuántos chips de personalidad entran sin desbordar el ancho de la tarjeta. */
const MAXIMO_CHIPS = 3;

/**
 * La banda de abajo: marrón muy oscuro que se desvanece hacia arriba. Es el mismo tono
 * de la tinta del sistema y no un negro puro, así el degradado no ensucia la foto.
 */
const BANDA = ['rgba(43,22,9,0)', 'rgba(43,22,9,0.55)', 'rgba(43,22,9,0.92)'] as const;

interface TarjetaAdopcionProps {
  publicacion: PublicacionFeed;
}

export function TarjetaAdopcion({ publicacion }: TarjetaAdopcionProps) {
  const { mascota } = publicacion;
  const [fotoFallo, setFotoFallo] = useState(false);

  const foto = urlAbsoluta(publicacion.imagenes[0] ?? mascota.imagenUrl);
  const chips = publicacion.personalidad.slice(0, MAXIMO_CHIPS);

  return (
    <View
      className="flex-1 overflow-hidden rounded-[28px]"
      style={{
        backgroundColor: PALETA.accent[200],
        shadowColor: PALETA.neutral[900],
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
      }}
    >
      {foto && !fotoFallo ? (
        <Image
          source={{ uri: foto }}
          className="h-full w-full"
          resizeMode="cover"
          onError={() => setFotoFallo(true)}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="paw" size={64} color={PALETA.accent[300]} />
        </View>
      )}

      {/* Se muestra solo con más de una foto: un "1 de 1" no aporta nada. */}
      {publicacion.imagenes.length > 1 ? (
        <View className="absolute right-3.5 top-3.5 rounded-full bg-white/90 px-2.5 py-1">
          <Text className="font-cuerpo-bold text-[11.5px]" style={{ color: PALETA.accent[800] }}>
            1 de {publicacion.imagenes.length}
          </Text>
        </View>
      ) : null}

      {/* `style` y no `className`: NativeWind solo mapea las clases en componentes de
          React Native, y LinearGradient viene de una librería. */}
      <LinearGradient
        colors={BANDA}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 18,
          paddingBottom: 18,
          paddingTop: 44,
        }}
      >
        <Text numberOfLines={1} className="font-titulo text-[31px] leading-[35px] text-white">
          {mascota.nombre ?? 'Sin nombre'}
        </Text>

        <Text className="mt-1.5 font-cuerpo text-[13.5px] text-white/90">
          {resumenMascota(mascota)}
        </Text>

        {chips.length > 0 ? (
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            {chips.map((rasgo) => (
              <Chip key={rasgo} etiqueta={rasgo} variante="sobre-imagen" />
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
