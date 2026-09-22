/**
 * Una burbuja de la conversación (GUI-14, criterios 3 y 4), según los artboards 35 y 37 del
 * diseño Organic.
 *
 * Propia: a la DERECHA, `accent-600` sólido, texto blanco, esquina inferior derecha cortada.
 * Recibida: a la IZQUIERDA, `neutral-100`, texto oscuro, esquina inferior izquierda cortada
 * y una sombra suave. El diseño da los radios en `17 15 4 15` sobre una maqueta de 262px;
 * con el factor ×1,33 quedan en 23 / 20 / 5.
 *
 * La foto va SUELTA, fuera de la burbuja (artboard 37): un mensaje de sólo foto no tiene
 * burbuja, y uno con foto y texto pinta la foto arriba y la burbuja del texto debajo. El
 * pie "Enviaste una foto · 16:10" sólo existe para la foto propia; la recibida va pelada,
 * como en el artboard.
 *
 * El acuse de los mensajes propios va junto a la hora, dentro de la burbuja: "Enviando…"
 * mientras el POST está en vuelo, y después los tildes de `TicksMensaje`.
 *
 * No sabe de dónde salió el mensaje: recibe un `ItemChat` ya armado, así que un mensaje del
 * historial, uno que llegó por socket y uno que todavía está subiendo se pintan con el
 * mismo componente.
 */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { GrillaAdjuntosMensaje } from '@/components/chat/GrillaAdjuntosMensaje';
import { TarjetaSolicitudChat } from '@/components/chat/TarjetaSolicitudChat';
import { entregaDe, TicksMensaje } from '@/components/chat/TicksMensaje';
import { PALETA } from '@/constants/theme';
import type { ItemChat } from '@/lib/mensajesChat';
import { horaVisible } from '@/shared/validation/dates';

/** Radios del artboard: 17 y 15 en las esquinas grandes, 4 en la "colita". */
const RADIO_SUPERIOR = 23;
const RADIO_INFERIOR = 20;
const RADIO_COLA = 5;

/** Padding interno de la burbuja: 8/11 del artboard. */
const RELLENO = { paddingHorizontal: 15, paddingVertical: 11 };

/** Miniatura de la grilla cuando el mensaje trae varias: 88 de lado en el artboard. */
const LADO_MINIATURA = 117;
/** Foto propia: 104 de alto y el 76% del ancho disponible. */
const ALTO_FOTO_PROPIA = 139;
const FRACCION_FOTO_PROPIA = 0.76;
/** El padding horizontal de la lista en la pantalla de conversación. */
const MARGEN_LISTA = 16 * 2;

/** Sombra del artboard: `0 2px 8px rgba(150,120,80,.10)`. Sólo la lleva la burbuja recibida. */
const SOMBRA = {
  shadowColor: '#966850',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 2,
};

const RADIOS_PROPIA = {
  borderTopLeftRadius: RADIO_SUPERIOR,
  borderTopRightRadius: RADIO_INFERIOR,
  borderBottomRightRadius: RADIO_COLA,
  borderBottomLeftRadius: RADIO_INFERIOR,
};

const RADIOS_RECIBIDA = {
  borderTopLeftRadius: RADIO_SUPERIOR,
  borderTopRightRadius: RADIO_INFERIOR,
  borderBottomRightRadius: RADIO_INFERIOR,
  borderBottomLeftRadius: RADIO_COLA,
};

interface BurbujaMensajeProps {
  item: ItemChat;
  /** Sólo en las propias que fallaron. */
  onReintentar?: () => void;
  onDescartar?: () => void;
  /** Abre la foto a pantalla completa, por posición. El visor lo monta la pantalla. */
  onAbrirImagen?: (indice: number) => void;
  /** Navega al detalle de la solicitud embebida. Sólo en los mensajes de sistema. */
  onVerSolicitud?: () => void;
}

/** Hora del mensaje dentro de la burbuja, o el estado mientras no hay fecha del servidor. */
function PieBurbuja({ item }: { item: ItemChat }) {
  const claseTexto = item.esMio ? 'text-white/80' : 'text-organic-neutral-500';

  if (item.estado === 'enviando') {
    return (
      <View className="mt-1 flex-row items-center justify-end gap-1">
        <ActivityIndicator size="small" color={PALETA.blanco} />
        <Text className={`font-cuerpo text-[11px] ${claseTexto}`}>Enviando…</Text>
      </View>
    );
  }

  if (item.estado === 'error') {
    return (
      <View className="mt-1 flex-row items-center justify-end gap-1">
        <Ionicons name="alert-circle" size={12} color={PALETA.blanco} />
        <Text className="font-cuerpo text-[11px] text-white">No se envió</Text>
      </View>
    );
  }

  return (
    <View
      className={`mt-1 flex-row items-center gap-1 ${
        item.esMio ? 'justify-end' : 'justify-start'
      }`}
    >
      <Text className={`font-cuerpo text-[11px] ${claseTexto}`}>
        {item.fecha ? horaVisible(new Date(item.fecha)) : ''}
      </Text>

      {/* Sólo en las propias: a nadie se le muestra si leyó lo que le mandaron. */}
      {item.esMio ? <TicksMensaje entrega={entregaDe(item)} fondo="burbuja" tamanio={14} /> : null}
    </View>
  );
}

/** Pie de los adjuntos propios sin texto: reemplaza a la burbuja que ese mensaje no tiene. */
function PieFotoPropia({ item }: { item: ItemChat }) {
  if (item.estado === 'enviando') {
    return (
      <View className="mt-1 flex-row items-center justify-end gap-1">
        <ActivityIndicator size="small" color={PALETA.neutral[600]} />
        <Text className="font-cuerpo text-[11px] text-organic-neutral-600">Enviando…</Text>
      </View>
    );
  }

  if (item.estado === 'error') {
    return (
      <View className="mt-1 flex-row items-center justify-end gap-1">
        <Ionicons name="alert-circle" size={12} color={PALETA.accent[700]} />
        <Text className="font-cuerpo text-[11px] text-organic-accent-700">No se envió</Text>
      </View>
    );
  }

  const cuantas = item.adjuntos.length;

  // Un mensaje no mezcla fotos con video, así que alcanza con mirar el primero. Un video va
  // siempre solo: nunca hay que decir "2 videos".
  const esVideo = item.adjuntos[0]?.tipo === 'VIDEO';
  const que = esVideo ? 'un video' : cuantas === 1 ? 'una foto' : `${cuantas} fotos`;

  return (
    <View className="mt-1 flex-row items-center justify-end gap-[5px]">
      <Text className="font-cuerpo text-[11px] text-organic-neutral-600">
        {`Enviaste ${que}${item.fecha ? ` · ${horaVisible(new Date(item.fecha))}` : ''}`}
      </Text>

      <TicksMensaje entrega={entregaDe(item)} fondo="pantalla" />
    </View>
  );
}

export function BurbujaMensaje({
  item,
  onReintentar,
  onDescartar,
  onAbrirImagen,
  onVerSolicitud,
}: BurbujaMensajeProps) {
  const { width: anchoPantalla } = useWindowDimensions();

  // La tarjeta de la solicitud no es una burbuja: ocupa el ancho y no tiene lado.
  if (item.tipo === 'SOLICITUD') {
    return item.solicitud ? (
      <TarjetaSolicitudChat
        solicitud={item.solicitud}
        fecha={item.fecha}
        onVerSolicitud={onVerSolicitud}
      />
    ) : null;
  }

  const propia = item.esMio;
  const hayAdjuntos = item.adjuntos.length > 0;
  const soloFotos = hayAdjuntos && !item.contenido;
  const anchoFotoPropia = Math.floor((anchoPantalla - MARGEN_LISTA) * FRACCION_FOTO_PROPIA);

  return (
    <View className={`w-full ${propia ? 'items-end' : 'items-start'}`}>
      {hayAdjuntos ? (
        <GrillaAdjuntosMensaje
          adjuntos={item.adjuntos}
          lado={LADO_MINIATURA}
          anchoUnica={propia ? anchoFotoPropia : LADO_MINIATURA}
          altoUnica={propia ? ALTO_FOTO_PROPIA : LADO_MINIATURA}
          subiendo={item.estado === 'enviando'}
          onAbrir={onAbrirImagen}
        />
      ) : null}

      {/* Un mensaje de sólo fotos no tiene burbuja: las propias llevan su pie debajo y las
          recibidas van peladas, como en el artboard 37. */}
      {soloFotos ? (
        propia ? (
          <View style={{ width: anchoFotoPropia }}>
            <PieFotoPropia item={item} />
          </View>
        ) : null
      ) : (
        <View
          style={{
            ...(propia ? RADIOS_PROPIA : RADIOS_RECIBIDA),
            ...RELLENO,
            ...(propia ? null : SOMBRA),
          }}
          className={`max-w-[80%] ${hayAdjuntos ? 'mt-[5px]' : ''} ${
            propia ? 'bg-organic-accent-600' : 'bg-organic-neutral-100'
          }`}
        >
          <Text
            className={`font-cuerpo text-[14px] leading-[19px] ${
              propia ? 'text-white' : 'text-organic-neutral-900'
            }`}
          >
            {item.contenido}
          </Text>

          <PieBurbuja item={item} />
        </View>
      )}

      {/* El error no se traga el mensaje: el texto sigue en la burbuja y se puede reintentar
          sin volver a escribirlo. */}
      {item.estado === 'error' ? (
        <View className="mt-1 flex-row justify-end gap-3">
          <Pressable accessibilityRole="button" onPress={onReintentar} hitSlop={8}>
            <Text className="font-cuerpo-semi text-[12px] text-organic-accent-600">Reintentar</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onDescartar} hitSlop={8}>
            <Text className="font-cuerpo text-[12px] text-organic-neutral-500">Descartar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
