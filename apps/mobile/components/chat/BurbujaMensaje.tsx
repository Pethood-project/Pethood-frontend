/**
 * Una burbuja de la conversación (GUI-14, criterios 3 y 4).
 *
 * Propia: a la DERECHA, gradiente naranja, texto blanco, esquina inferior derecha cortada.
 * Recibida: a la IZQUIERDA, fondo blanco, texto oscuro, esquina inferior izquierda cortada
 * y una sombra suave. El diseño da los radios en 15/4 sobre una maqueta de 262px; con el
 * factor de conversión de HU-5.1 quedan en 20/5.
 *
 * No sabe de dónde salió el mensaje: recibe un `ItemChat` ya armado, así que un mensaje del
 * historial, uno que llegó por socket y uno que todavía está subiendo se pintan con el
 * mismo componente.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import type { ItemChat } from '@/lib/mensajesChat';
import { horaVisible } from '@/shared/validation/dates';

const RADIO = 20;
/** La esquina del lado de quien escribe se corta: es lo que da la "colita" de la burbuja. */
const RADIO_COLA = 5;

/**
 * Padding interno de la burbuja (8/11 del artboard, con el factor de HU-5.1).
 *
 * Va como `style` y no como clase porque NativeWind sólo mapea `className` en componentes
 * de React Native, y `LinearGradient` viene de una librería — mismo motivo que documenta
 * `TarjetaAdopcion`. Se comparte con la burbuja recibida para que las dos midan igual.
 */
const RELLENO = { paddingHorizontal: 14, paddingVertical: 10 };

/** Alto de la foto dentro de la burbuja. El ancho lo fija el 80% de la burbuja. */
const ALTO_IMAGEN = 180;

/** Sombra del artboard: `0 2px 8px rgba(150,120,80,.10)`. Sólo la lleva la burbuja recibida. */
const SOMBRA = {
  shadowColor: '#966850',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 2,
};

interface BurbujaMensajeProps {
  item: ItemChat;
  /** Sólo en las propias que fallaron. */
  onReintentar?: () => void;
  onDescartar?: () => void;
  /** Abre la foto a pantalla completa. El visor lo monta la pantalla, no cada burbuja. */
  onAbrirImagen?: () => void;
}

/** Hora del mensaje, o el estado mientras todavía no hay una fecha del servidor. */
function PieBurbuja({ item }: { item: ItemChat }) {
  const colorTexto = item.esMio ? 'rgba(255,255,255,0.8)' : PALETA.neutral[500];

  if (item.estado === 'enviando') {
    return (
      <View className="mt-1 flex-row items-center justify-end gap-1">
        <ActivityIndicator size="small" color={colorTexto} />
        <Text style={{ color: colorTexto }} className="text-[11px]">
          Enviando…
        </Text>
      </View>
    );
  }

  if (item.estado === 'error') {
    return (
      <View className="mt-1 flex-row items-center justify-end gap-1">
        <Ionicons name="alert-circle" size={12} color={PALETA.blanco} />
        <Text className="text-[11px] text-white">No se envió</Text>
      </View>
    );
  }

  return (
    <View
      className={`mt-1 flex-row items-center gap-1 ${
        item.esMio ? 'justify-end' : 'justify-start'
      }`}
    >
      <Text style={{ color: colorTexto }} className="text-[11px]">
        {item.fecha ? horaVisible(new Date(item.fecha)) : ''}
      </Text>

      {/* Doble check sólo en las propias: el estado de lectura del otro no se muestra. */}
      {item.esMio ? (
        <Ionicons
          name={item.leido ? 'checkmark-done' : 'checkmark'}
          size={13}
          color={colorTexto}
        />
      ) : null}
    </View>
  );
}

/** Foto del mensaje, con su lugar reservado mientras carga para que la lista no salte. */
function ImagenMensaje({
  uri,
  subiendo,
  onAbrir,
}: {
  uri: string;
  subiendo: boolean;
  onAbrir?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel="Ver la foto en grande"
      // Mientras sube no se abre: la foto todavía no es la definitiva y ampliarla mostraría
      // el archivo local, no lo que quedó guardado.
      onPress={subiendo ? undefined : onAbrir}
      disabled={subiendo || !onAbrir}
      style={{ height: ALTO_IMAGEN, borderRadius: RADIO - 6 }}
      className="mb-1.5 w-full overflow-hidden bg-pethood-beige-dark active:opacity-90"
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        accessibilityLabel="Foto del mensaje"
      />

      {/* Una foto tarda mucho más que un texto: sin esto la burbuja se vería terminada
          cuando en realidad todavía está subiendo. */}
      {subiendo ? (
        <View className="absolute inset-0 items-center justify-center bg-black/35">
          <ActivityIndicator color={PALETA.blanco} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Contenido({ item, onAbrirImagen }: { item: ItemChat; onAbrirImagen?: () => void }) {
  return (
    <>
      {item.imagen ? (
        <ImagenMensaje
          uri={item.imagen}
          subiendo={item.estado === 'enviando'}
          onAbrir={onAbrirImagen}
        />
      ) : null}

      {/* Un mensaje puede ser sólo foto: ahí `contenido` viene vacío y no se pinta el texto. */}
      {item.contenido ? (
        <Text
          className={`text-sm leading-5 ${item.esMio ? 'text-white' : 'text-organic-neutral-900'}`}
        >
          {item.contenido}
        </Text>
      ) : null}

      <PieBurbuja item={item} />
    </>
  );
}

export function BurbujaMensaje({
  item,
  onReintentar,
  onDescartar,
  onAbrirImagen,
}: BurbujaMensajeProps) {
  const radios = item.esMio
    ? {
        borderTopLeftRadius: RADIO,
        borderTopRightRadius: RADIO,
        borderBottomRightRadius: RADIO_COLA,
        borderBottomLeftRadius: RADIO,
      }
    : {
        borderTopLeftRadius: RADIO,
        borderTopRightRadius: RADIO,
        borderBottomRightRadius: RADIO,
        borderBottomLeftRadius: RADIO_COLA,
      };

  return (
    <View className={`w-full ${item.esMio ? 'items-end' : 'items-start'}`}>
      <View className="max-w-[80%]">
        {item.esMio ? (
          <LinearGradient
            // El artboard lo da como `linear-gradient(135deg, …)`: en un cuadrado, 135°
            // equivale a la diagonal de arriba-izquierda a abajo-derecha.
            colors={[PALETA.pethood.naranja, PALETA.pethood.naranjaOscuro]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ ...radios, ...RELLENO }}
          >
            <Contenido item={item} onAbrirImagen={onAbrirImagen} />
          </LinearGradient>
        ) : (
          <View style={{ ...radios, ...RELLENO, ...SOMBRA }} className="bg-white">
            <Contenido item={item} onAbrirImagen={onAbrirImagen} />
          </View>
        )}

        {/* El error no se traga el mensaje: el texto sigue en la burbuja y se puede
            reintentar sin volver a escribirlo. */}
        {item.estado === 'error' ? (
          <View className="mt-1 flex-row justify-end gap-3">
            <Pressable accessibilityRole="button" onPress={onReintentar} hitSlop={8}>
              <Text className="text-xs font-semibold text-pethood-orange">Reintentar</Text>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onDescartar} hitSlop={8}>
              <Text className="text-xs text-organic-neutral-500">Descartar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
