/**
 * La ubicación del refugio en la conversación: la tarjeta que queda cuando alguien del refugio
 * la manda desde "Enviar en el chat".
 *
 * Mismo molde que la mascota compartida (`TarjetaMascotaChat`): la foto del refugio en el
 * bloque redondeado y abajo su nombre, la dirección y el botón "Ver en Google Maps", el mismo
 * que el popup de un aviso de mascota perdida. Todo sale del perfil del refugio, resuelto en
 * cada pedido: si el refugio se muda, la tarjeta muestra la dirección nueva.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { UbicacionRefugioEnChat } from '@/services/chats';

const ALTO_FOTO = 130;

interface TarjetaUbicacionChatProps {
  ubicacion: UbicacionRefugioEnChat;
}

export function TarjetaUbicacionChat({ ubicacion }: TarjetaUbicacionChatProps) {
  const foto = urlAbsoluta(ubicacion.imagenUrl);
  const { mapaUrl } = ubicacion;

  return (
    <View
      style={{
        shadowColor: '#966850',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 3,
      }}
      className="rounded-[24px] border border-organic-neutral-300 bg-organic-neutral-100 p-[13px]"
    >
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="location" size={12} color={PALETA.accent[600]} />
        <Text className="font-cuerpo-bold text-[11px] uppercase tracking-[0.5px] text-organic-accent-600">
          Ubicación del refugio
        </Text>
      </View>

      <View
        style={{ height: ALTO_FOTO, borderRadius: 17 }}
        className="mt-[9px] items-center justify-center overflow-hidden bg-organic-accent-600"
      >
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel={`Foto de ${ubicacion.nombre}`}
          />
        ) : (
          // Sin foto, el edificio de `LogoRefugio`: es la organización, no una persona.
          <Ionicons name="business" size={35} color="rgba(255,255,255,0.75)" />
        )}
      </View>

      <Text
        numberOfLines={2}
        className="mt-[9px] font-titulo text-[19px] leading-[23px] text-organic-neutral-900"
      >
        {ubicacion.nombre}
      </Text>

      {ubicacion.ubicacion ? (
        <View className="mt-1 flex-row items-start gap-1.5">
          <Ionicons
            name="location-outline"
            size={15}
            color={PALETA.neutral[600]}
            style={{ marginTop: 1 }}
          />
          <Text className="min-w-0 flex-1 font-cuerpo text-[13px] leading-[18px] text-organic-neutral-600">
            {ubicacion.ubicacion}
          </Text>
        </View>
      ) : null}

      {mapaUrl ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Ver ${ubicacion.nombre} en Google Maps`}
          onPress={() => void Linking.openURL(mapaUrl).catch(() => undefined)}
          className="mt-[11px] flex-row items-center justify-center gap-2 rounded-2xl border border-organic-accent-600 py-[10px] active:opacity-70"
        >
          <Ionicons name="map-outline" size={17} color={PALETA.accent[600]} />
          <Text className="font-cuerpo-semi text-[13px] text-organic-accent-600">
            Ver en Google Maps
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
