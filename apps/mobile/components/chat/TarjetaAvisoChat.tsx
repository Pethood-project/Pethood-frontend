/**
 * El aviso de mascota perdida/encontrada embebido en la conversación (GUI-14, HU-13.2): la
 * tarjeta que PetHood deja en la sala cuando alguien reclama un aviso.
 *
 * Existe para que el reportante sepa de qué aviso le están hablando, y con la conversación
 * compartida es lo único que lo dice: la misma sala puede tener una solicitud de adopción y dos
 * avisos distintos, y sin la tarjeta todo sería la misma lista de mensajes con la misma persona.
 *
 * Misma anatomía que `TarjetaSolicitudChat` —no es una burbuja, ocupa todo el ancho, la emite
 * el sistema, va precedida por la firma "PetHood · hh:mm" y lleva su propia acción— con tres
 * diferencias por lo que el aviso tiene y la solicitud no:
 *
 * - La pastilla de estado es `EstadoAnimalPerdidoBadge`, el mismo componente del portal, en
 *   vez de un mapa de colores propio: los tres estados ya tienen su color decidido ahí.
 * - El subtítulo es «lugar · fecha del suceso», que es lo que identifica un aviso.
 * - **No hay distancia ni coordenadas.** El backend no las manda (regla 6 de la spec 020) y la
 *   distancia depende de dónde está quien mira, que acá no viene al caso.
 *
 * Medidas tomadas de la tarjeta de solicitud, que es la que fijó el patrón en el artboard 36.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { EstadoAnimalPerdidoBadge } from '@/components/ui/EstadoAnimalPerdidoBadge';
import { urlAbsoluta } from '@/services/api';
import type { AvisoEnChat } from '@/services/chats';
import { aFechaVisible, horaVisible, parsearFecha } from '@/shared/validation/dates';

const ALTO_FOTO = 109;

/**
 * El título: el nombre del animal o, si el aviso no lo tiene, la especie.
 *
 * Un aviso "Encontrado" puede no tener nombre —quien encuentra un animal no sabe cómo se
 * llama—, y es el mismo relleno que usa la tarjeta del portal.
 */
function tituloAviso(aviso: AvisoEnChat): string {
  if (aviso.nombre) return aviso.nombre;
  return aviso.especie ?? 'Mascota';
}

/** «Godoy Cruz - Mendoza · 28/08», con lo que haya. */
function subtitulo(aviso: AvisoEnChat): string | null {
  const suceso = parsearFecha(aviso.fechaSuceso);
  const partes = [aviso.ubicacion, suceso ? aFechaVisible(suceso) : null].filter(Boolean);

  return partes.length > 0 ? partes.join(' · ') : null;
}

interface TarjetaAvisoChatProps {
  aviso: AvisoEnChat;
  /** Hora del mensaje que la trajo, para la firma de PetHood. */
  fecha: string | null;
  /** Abre el popup del aviso en la sala. Sin esto el botón no se dibuja. */
  onVerAviso?: () => void;
}

export function TarjetaAvisoChat({ aviso, fecha, onVerAviso }: TarjetaAvisoChatProps) {
  const titulo = tituloAviso(aviso);
  const detalle = subtitulo(aviso);
  const foto = urlAbsoluta(aviso.imagenUrl);

  return (
    <View className="w-full">
      <Text className="mb-1 font-cuerpo text-[11px] text-organic-neutral-600">
        {`PetHood${fecha ? ` · ${horaVisible(new Date(fecha))}` : ''}`}
      </Text>

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
        <EstadoAnimalPerdidoBadge estado={aviso.estado} />

        <Text className="mt-[7px] font-titulo text-[19px] leading-[21px] text-organic-neutral-900">
          {titulo}
        </Text>

        {detalle ? (
          <Text className="mt-1 font-cuerpo text-[12px] text-organic-neutral-600">{detalle}</Text>
        ) : null}

        <View
          style={{ height: ALTO_FOTO, borderRadius: 17 }}
          className="mt-[9px] items-center justify-center overflow-hidden bg-organic-calido-naranja"
        >
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessibilityLabel={`Foto de ${titulo}`}
            />
          ) : (
            // Sin foto queda el bloque de color con la huella, como en la tarjeta de solicitud.
            <Ionicons name="paw" size={35} color="rgba(255,255,255,0.65)" />
          )}
        </View>

        {onVerAviso ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver el aviso"
            onPress={onVerAviso}
            className="mt-[11px] items-center rounded-2xl bg-organic-accent-600 py-[11px] active:opacity-85"
          >
            <Text className="font-cuerpo-semi text-[13px] text-white">Ver el aviso</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
