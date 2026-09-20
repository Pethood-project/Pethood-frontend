/**
 * La solicitud embebida en la conversación (GUI-14, artboard 36): la tarjeta que PetHood
 * deja en la sala cuando se envía un pedido de adopción o tránsito.
 *
 * No es una burbuja: ocupa todo el ancho, la emite el sistema y lleva su propia acción para
 * ir al detalle. Va precedida por la línea "PetHood · hh:mm", que la firma.
 *
 * Medidas del artboard (sobre 262px, con el factor ×1,33): tarjeta en `neutral-100` con
 * borde `neutral-300`, radio 24 y padding 13; título en Caprasimo 19; foto de 109 de alto y
 * radio 17; botón en `accent-600` con radio 16.
 *
 * El backend manda el estado ya resuelto y la fecha en ISO: el color de la píldora y el
 * texto de la edad se deciden acá, igual que en el resto de la app.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { SolicitudEnChat } from '@/services/chats';
import { aFechaVisible, edadEnTexto, horaVisible, parsearFecha } from '@/shared/validation/dates';

const ALTO_FOTO = 109;

/**
 * Colores de la píldora de estado.
 *
 * Los del artboard: "En revisión" sobre el amarillo claro, que es el que el diseño usa para
 * lo que está en curso. Para los estados finales se reusan los tonos que el sistema ya tiene
 * para lo mismo, en vez de inventar dos colores nuevos.
 */
const ESTILO_ESTADO: Record<string, { fondo: string; texto: string }> = {
  Pendiente: { fondo: PALETA.calido.amarilloClaro, texto: PALETA.accent[800] },
  Aceptada: { fondo: PALETA.accent[200], texto: PALETA.accent[700] },
  Rechazada: { fondo: PALETA.neutral[200], texto: PALETA.neutral[700] },
  Cancelada: { fondo: PALETA.neutral[200], texto: PALETA.neutral[700] },
};

const ESTILO_POR_DEFECTO = { fondo: PALETA.neutral[200], texto: PALETA.neutral[700] };

/** "Perro · 2 años", o sólo la especie si la mascota no tiene fecha de nacimiento cargada. */
function resumenMascota(solicitud: SolicitudEnChat): string {
  const nacimiento = parsearFecha(solicitud.mascota.fechaNacimiento);
  const edad = nacimiento ? edadEnTexto(nacimiento) : null;

  return edad ? `${solicitud.mascota.especie} · ${edad}` : solicitud.mascota.especie;
}

interface TarjetaSolicitudChatProps {
  solicitud: SolicitudEnChat;
  /** Hora del mensaje que la trajo, para la firma de PetHood. */
  fecha: string | null;
  /** Navega al detalle de la solicitud. Sin esto el botón no se dibuja. */
  onVerSolicitud?: () => void;
}

export function TarjetaSolicitudChat({
  solicitud,
  fecha,
  onVerSolicitud,
}: TarjetaSolicitudChatProps) {
  const estado = ESTILO_ESTADO[solicitud.estado] ?? ESTILO_POR_DEFECTO;
  const enviada = parsearFecha(solicitud.fechaAlta);
  const foto = urlAbsoluta(solicitud.mascota.imagenUrl);

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
        <View
          style={{ backgroundColor: estado.fondo }}
          className="self-start rounded-full px-[11px] py-[3px]"
        >
          <Text style={{ color: estado.texto }} className="font-cuerpo-bold text-[10px]">
            {solicitud.estado}
          </Text>
        </View>

        <Text className="mt-[7px] font-titulo text-[19px] leading-[21px] text-organic-neutral-900">
          {`Solicitud de ${solicitud.tipo.toLowerCase()}${
            solicitud.mascota.nombre ? ` · ${solicitud.mascota.nombre}` : ''
          }`}
        </Text>

        <Text className="mt-1 font-cuerpo text-[12px] text-organic-neutral-600">
          {`${enviada ? `Enviada el ${aFechaVisible(enviada)} · ` : ''}${resumenMascota(solicitud)}`}
        </Text>

        <View
          style={{ height: ALTO_FOTO, borderRadius: 17 }}
          className="mt-[9px] items-center justify-center overflow-hidden bg-organic-calido-naranja"
        >
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessibilityLabel={`Foto de ${solicitud.mascota.nombre ?? 'la mascota'}`}
            />
          ) : (
            // Sin foto queda el bloque de color con la huella, como en el artboard.
            <Ionicons name="paw" size={35} color="rgba(255,255,255,0.65)" />
          )}
        </View>

        {onVerSolicitud ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver mi solicitud"
            onPress={onVerSolicitud}
            className="mt-[11px] items-center rounded-2xl bg-organic-accent-600 py-[11px] active:opacity-85"
          >
            <Text className="font-cuerpo-semi text-[13px] text-white">Ver mi solicitud</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
