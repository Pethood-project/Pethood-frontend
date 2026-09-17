/**
 * Tarjeta de la grilla de Inicio: bloque de color con la foto arriba y, debajo, el título
 * y el enlace con la flecha.
 *
 * Los colores llegan como token de la paleta y no como clase de Tailwind porque el mismo
 * valor tiene que pintar el texto y también el ícono de la flecha, que solo acepta un hex.
 *
 * El título reserva dos líneas siempre, para que las cuatro tarjetas corten a la misma
 * altura entre en una línea o en dos.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import type { AccesoHome } from '@/constants/home';
import { PALETA } from '@/constants/theme';

interface TarjetaAccesoProps {
  acceso: AccesoHome;
  /** Sin esto la tarjeta se ve completa pero no responde: su pantalla todavía no existe. */
  onPress?: () => void;
}

export function TarjetaAcceso({ acceso, onPress }: TarjetaAccesoProps) {
  const { titulo, cta, imagen, fondo, texto, marco, aviso } = acceso;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={aviso ? `${titulo}, ${aviso}. ${cta}` : `${titulo}. ${cta}`}
      accessibilityState={{ disabled: !onPress }}
      onPress={onPress}
      className="flex-1 rounded-[28px] px-[7px] pt-[7px] active:opacity-90"
      style={{
        backgroundColor: fondo,
        shadowColor: PALETA.neutral[900],
        shadowOpacity: 0.14,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    >
      <View
        className="flex-1 overflow-hidden rounded-[22px]"
        style={{ backgroundColor: marco }}
      >
        <Image source={imagen} className="h-full w-full" resizeMode="cover" />
      </View>

      {aviso ? (
        <View
          className="absolute right-[15px] top-[15px] rounded-full px-[9px] py-0.5"
          style={{ backgroundColor: PALETA.accent[900] }}
        >
          <Text
            className="font-cuerpo-bold text-[11px]"
            style={{ color: PALETA.accent[100] }}
          >
            {aviso}
          </Text>
        </View>
      ) : null}

      <View className="px-2 pb-[13px] pt-[11px]">
        <Text
          className="font-titulo text-[15.5px] leading-[17.5px]"
          style={{ color: texto, minHeight: 35 }}
          numberOfLines={2}
        >
          {titulo}
        </Text>

        <View className="mt-[5px] flex-row items-center justify-between opacity-90">
          <Text className="font-cuerpo-semi text-[12.5px]" style={{ color: texto }}>
            {cta}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={texto} />
        </View>
      </View>
    </Pressable>
  );
}
