/**
 * La mascota compartida en la conversación: la tarjeta que queda cuando alguien comparte una
 * de sus favoritas con su dueño ("me interesa esta").
 *
 * Sigue el molde de la solicitud embebida (`TarjetaSolicitudChat`, artboard 36): tarjeta en
 * `neutral-100` con borde y radio 24, título en Caprasimo, la foto en un bloque redondeado y el
 * botón en `accent-600`. La diferencia es que ésta la manda una persona: no lleva la firma
 * "PetHood" y va del lado de quien la mandó (lo resuelve `BurbujaMensaje`).
 *
 * Los datos se resuelven en cada pedido. Si la mascota ya no está publicada no hay a dónde
 * llevar, así que en lugar del botón va una línea que lo explica.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { EstadoMascotaBadge } from '@/components/ui/EstadoMascotaBadge';
import { resumenMascota } from '@/constants/Mascotas';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { MascotaEnChat } from '@/services/chats';

const ALTO_FOTO = 130;

interface TarjetaMascotaChatProps {
  mascota: MascotaEnChat;
  /** Lleva a la publicación. Sin esto (o sin publicación activa) el botón no se dibuja. */
  onVerMascota?: () => void;
}

export function TarjetaMascotaChat({ mascota, onVerMascota }: TarjetaMascotaChatProps) {
  const foto = urlAbsoluta(mascota.imagenUrl);
  const nombre = mascota.nombre ?? mascota.especie;
  // "2 años · Mediano · Hembra", la misma línea que la ficha y la tarjeta del feed.
  const resumen = resumenMascota(mascota);

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
        <Ionicons name="heart" size={12} color={PALETA.accent[600]} />
        <Text className="font-cuerpo-bold text-[11px] uppercase tracking-[0.5px] text-organic-accent-600">
          Mascota compartida
        </Text>
      </View>

      <View
        style={{ height: ALTO_FOTO, borderRadius: 17 }}
        className="mt-[9px] items-center justify-center overflow-hidden bg-organic-calido-naranja"
      >
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel={`Foto de ${nombre}`}
          />
        ) : (
          // Sin foto queda el bloque de color con la huella, como en la solicitud.
          <Ionicons name="paw" size={35} color="rgba(255,255,255,0.65)" />
        )}
      </View>

      <View className="mt-[9px] flex-row items-start justify-between gap-2">
        <Text
          numberOfLines={1}
          className="min-w-0 flex-1 font-titulo text-[19px] leading-[23px] text-organic-neutral-900"
        >
          {nombre}
        </Text>
        {mascota.estado ? <EstadoMascotaBadge estado={mascota.estado} /> : null}
      </View>

      <Text numberOfLines={1} className="mt-0.5 font-cuerpo text-[13px] text-organic-neutral-600">
        {`${mascota.especie} · ${mascota.raza}`}
      </Text>

      {resumen ? (
        <Text numberOfLines={1} className="font-cuerpo text-[13px] text-organic-neutral-600">
          {resumen}
        </Text>
      ) : null}

      {mascota.publicacionId !== null && onVerMascota ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver a ${nombre}`}
          onPress={onVerMascota}
          className="mt-[11px] items-center rounded-2xl bg-organic-accent-600 py-[11px] active:opacity-85"
        >
          <Text className="font-cuerpo-semi text-[13px] text-white">Ver mascota</Text>
        </Pressable>
      ) : (
        <Text className="mt-[11px] text-center font-cuerpo text-[12px] italic text-organic-neutral-500">
          Esta mascota ya no está publicada
        </Text>
      )}
    </View>
  );
}
