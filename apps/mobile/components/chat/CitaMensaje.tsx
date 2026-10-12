/**
 * La cita del mensaje que se está respondiendo, como en cualquier app de mensajería: una
 * franja de color a la izquierda, quién lo escribió y una línea de lo que decía, con la
 * miniatura a la derecha si era una foto.
 *
 * Va en dos lugares con el mismo componente: dentro de la burbuja que responde y arriba de la
 * barra de escritura mientras se escribe la respuesta. Ni el artboard ni la HU la definen, así
 * que se armó con los tokens del diseño Organic: sobre la burbuja propia (`accent-600`) va un
 * velo blanco translúcido, y sobre la recibida o la barra, el `neutral-200` con la franja en
 * el acento.
 *
 * Tocarla lleva al mensaje citado: eso lo resuelve quien la monta, acá sólo llega `onPress`.
 *
 * Ocupa todo el ancho que le da su contenedor y el texto llega a tres líneas antes de cortarse
 * con "…", como en WhatsApp. Por eso la burbuja que la lleva va siempre al ancho máximo: si
 * se achicara al largo de la respuesta ("Ok"), la cita quedaría ilegible.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import type { CitaChat } from '@/lib/mensajesChat';

/** Lado de la miniatura de la foto citada. */
const MINIATURA = 40;
/** Hasta cuántas líneas del citado se ven antes del "…". */
const LINEAS_TEXTO = 3;

interface CitaMensajeProps {
  cita: CitaChat;
  /** "Vos" o el nombre del contacto. Lo resuelve quien la monta, que conoce la cabecera. */
  autor: string;
  /** `propia` va sobre la burbuja naranja; `neutra`, sobre la recibida o sobre la barra. */
  fondo: 'propia' | 'neutra';
  onPress?: () => void;
}

/** La línea de la cita: el texto, o qué adjunto era si no tenía texto. */
function textoDeCita(cita: CitaChat): string {
  if (cita.eliminado) return 'Se eliminó este mensaje';
  if (cita.contenido) return cita.contenido;
  if (!cita.adjunto) return '';
  if (cita.adjunto.tipo === 'VIDEO') return 'Video';
  return cita.adjunto.cantidad > 1 ? `${cita.adjunto.cantidad} fotos` : 'Foto';
}

export function CitaMensaje({ cita, autor, fondo, onPress }: CitaMensajeProps) {
  const propia = fondo === 'propia';
  const colorTexto = propia ? PALETA.blanco : PALETA.neutral[700];

  const icono: keyof typeof Ionicons.glyphMap | null = cita.eliminado
    ? 'ban-outline'
    : cita.adjunto?.tipo === 'VIDEO'
      ? 'videocam'
      : cita.adjunto
        ? 'image'
        : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Respuesta a ${autor}: ${textoDeCita(cita)}`}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row overflow-hidden rounded-[12px] ${
        propia ? 'bg-white/20' : 'bg-organic-neutral-200'
      } ${onPress ? 'active:opacity-80' : ''}`}
    >
      {/* La franja de la izquierda: lo que hace que se lea como cita y no como otro mensaje. */}
      <View className={`w-1 ${propia ? 'bg-white' : 'bg-organic-accent-600'}`} />

      <View className="min-w-0 flex-1 px-2.5 py-1.5">
        <Text
          numberOfLines={1}
          className={`font-cuerpo-semi text-[13px] ${
            propia ? 'text-white' : 'text-organic-accent-600'
          }`}
        >
          {autor}
        </Text>

        {/* Arriba y no centrado: con tres líneas, el ícono va con la primera. */}
        <View className="mt-0.5 flex-row items-start gap-1">
          {icono ? (
            <Ionicons name={icono} size={13} color={colorTexto} style={{ marginTop: 2.5 }} />
          ) : null}

          <Text
            numberOfLines={LINEAS_TEXTO}
            ellipsizeMode="tail"
            className={`min-w-0 flex-1 font-cuerpo text-[13px] leading-[18px] ${
              propia ? 'text-white/85' : 'text-organic-neutral-700'
            } ${cita.eliminado ? 'italic' : ''}`}
          >
            {textoDeCita(cita)}
          </Text>
        </View>
      </View>

      {!cita.eliminado && cita.adjunto?.miniatura ? (
        <Image
          source={{ uri: cita.adjunto.miniatura }}
          // Sin alto: la fila estira la miniatura hasta el alto del texto (`stretch`), y el
          // mínimo la deja cuadrada cuando la cita es de una sola línea.
          style={{ width: MINIATURA, minHeight: MINIATURA }}
          resizeMode="cover"
          accessibilityLabel="Foto citada"
        />
      ) : null}
    </Pressable>
  );
}
