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
 *
 * Tres gestos, todos sobre mensajes ya enviados:
 * - **Deslizar a la derecha** responde (`DeslizarParaResponder`): arriba de la barra queda la
 *   cita, y la respuesta la lleva adentro de su burbuja.
 * - **Mantener apretado** uno propio —texto, foto o video— pide eliminarlo; uno recibido abre
 *   el reporte. El diálogo de confirmación lo monta la pantalla.
 * - **Tocar la cita** lleva al mensaje citado.
 *
 * Un mensaje eliminado se pinta como el aviso "Se eliminó este mensaje", en su lado y con su
 * hora, y no admite ninguno de los tres.
 */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { CitaMensaje } from '@/components/chat/CitaMensaje';
import { DeslizarParaResponder } from '@/components/chat/DeslizarParaResponder';
import { GrillaAdjuntosMensaje } from '@/components/chat/GrillaAdjuntosMensaje';
import { TarjetaAvisoChat } from '@/components/chat/TarjetaAvisoChat';
import { TarjetaSolicitudChat } from '@/components/chat/TarjetaSolicitudChat';
import { entregaDe, TicksMensaje } from '@/components/chat/TicksMensaje';
import { PALETA } from '@/constants/theme';
import type { ItemChat } from '@/lib/mensajesChat';
import { horaVisible } from '@/shared/validation/dates';

/** Radios del artboard: 17 y 15 en las esquinas grandes, 4 en la "colita". */
const RADIO_SUPERIOR = 23;
const RADIO_INFERIOR = 20;
const RADIO_COLA = 5;

/** El mismo tope que el `max-w-[80%]` de la burbuja: el ancho de una burbuja con cita. */
const ANCHO_MAXIMO_BURBUJA = '80%';

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
  /** Navega al aviso de mascota perdida de la tarjeta (HU-13.2). */
  onVerAviso?: () => void;
  /** Mantener apretada una burbuja recibida: abre el reporte del mensaje. */
  onReportar?: () => void;
  /** Mantener apretada una propia (texto, foto o video): pide confirmar la eliminación. */
  onEliminar?: () => void;
  /** Deslizar a la derecha: responder este mensaje. Sin esto no se puede deslizar. */
  onResponder?: () => void;
  /** Tocar la cita: ir al mensaje citado. */
  onIrACita?: (mensajeId: number) => void;
  /** Nombre del contacto, para la cita de un mensaje suyo ("Vos" si es propio). */
  nombreContacto: string;
  /** Destello breve al llegar desde una cita, para que se vea cuál era. */
  resaltado?: boolean;
}

/**
 * El aviso que reemplaza a un mensaje eliminado. Va en el lado del autor y con su hora, como
 * en WhatsApp, pero sin tildes: no hay nada que acusar de algo que ya no está.
 */
function AvisoEliminado({ item }: { item: ItemChat }) {
  const propia = item.esMio;

  return (
    <View
      style={{
        ...(propia ? RADIOS_PROPIA : RADIOS_RECIBIDA),
        ...RELLENO,
        ...(propia ? null : SOMBRA),
      }}
      className={`max-w-[80%] ${propia ? 'bg-organic-accent-600' : 'bg-organic-neutral-100'}`}
    >
      <View className="flex-row items-center gap-1.5">
        <Ionicons
          name="ban-outline"
          size={15}
          color={propia ? PALETA.blanco : PALETA.neutral[500]}
        />
        <Text
          className={`font-cuerpo text-[15px] italic ${
            propia ? 'text-white/85' : 'text-organic-neutral-500'
          }`}
        >
          {propia ? 'Eliminaste este mensaje' : 'Se eliminó este mensaje'}
        </Text>
      </View>

      <Text
        className={`mt-1 font-cuerpo text-[11px] ${
          propia ? 'text-right text-white/80' : 'text-organic-neutral-500'
        }`}
      >
        {item.fecha ? horaVisible(new Date(item.fecha)) : ''}
      </Text>
    </View>
  );
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
  onVerAviso,
  onReportar,
  onEliminar,
  onResponder,
  onIrACita,
  nombreContacto,
  resaltado = false,
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

  // HU-13.2: el aviso reclamado, con el mismo tratamiento que la solicitud. Sin `aviso` no
  // se pinta nada: es un mensaje de sistema sin su carga, y una burbuja vacía sería peor.
  if (item.tipo === 'ANIMAL_PERDIDO') {
    return item.aviso ? (
      <TarjetaAvisoChat aviso={item.aviso} fecha={item.fecha} onVerAviso={onVerAviso} />
    ) : null;
  }

  const propia = item.esMio;

  if (item.eliminado) {
    return (
      <View className={`w-full ${propia ? 'items-end' : 'items-start'}`}>
        <AvisoEliminado item={item} />
      </View>
    );
  }

  const hayAdjuntos = item.adjuntos.length > 0;
  const soloFotos = hayAdjuntos && !item.contenido;
  const anchoFotoPropia = Math.floor((anchoPantalla - MARGEN_LISTA) * FRACCION_FOTO_PROPIA);
  const enviado = item.estado === 'enviado';

  // Mantener apretado: lo propio se elimina, lo ajeno se reporta. Sólo con el mensaje ya en el
  // servidor: uno en vuelo o fallido tiene sus propias acciones (Reintentar / Descartar).
  const alMantener = enviado ? (propia ? onEliminar : onReportar) : undefined;
  const etiquetaMantener = propia ? 'Eliminar mensaje' : 'Reportar mensaje';

  // Las mismas acciones para quien usa lector de pantalla, que no puede deslizar ni mantener.
  const accionesAccesibles = [
    ...(alMantener ? [{ name: 'longpress', label: etiquetaMantener }] : []),
    ...(enviado && onResponder ? [{ name: 'responder', label: 'Responder' }] : []),
  ];

  const alAccionAccesible = (nombre: string): void => {
    if (nombre === 'longpress') alMantener?.();
    if (nombre === 'responder') onResponder?.();
  };

  const cita = item.respondeA ? (
    <CitaMensaje
      cita={item.respondeA}
      autor={item.respondeA.esMia ? 'Vos' : nombreContacto}
      fondo={propia ? 'propia' : 'neutra'}
      onPress={onIrACita ? () => onIrACita(item.respondeA!.id) : undefined}
    />
  ) : null;

  return (
    <DeslizarParaResponder onResponder={enviado ? onResponder : undefined}>
      <View
        className={`w-full rounded-[20px] ${propia ? 'items-end' : 'items-start'} ${
          resaltado ? 'bg-organic-accent-200' : ''
        }`}
      >
        {/* Un mensaje de sólo fotos no tiene burbuja: la cita va en una propia, encima de la
            grilla, del color del lado que corresponde. */}
        {soloFotos && cita ? (
          <View
            style={{
              ...(propia ? RADIOS_PROPIA : RADIOS_RECIBIDA),
              padding: 5,
              width: propia ? anchoFotoPropia : LADO_MINIATURA * 2,
            }}
            className={`mb-[5px] ${propia ? 'bg-organic-accent-600' : 'bg-organic-neutral-100'}`}
          >
            {cita}
          </View>
        ) : null}

        {hayAdjuntos ? (
          <GrillaAdjuntosMensaje
            adjuntos={item.adjuntos}
            lado={LADO_MINIATURA}
            anchoUnica={propia ? anchoFotoPropia : LADO_MINIATURA}
            altoUnica={propia ? ALTO_FOTO_PROPIA : LADO_MINIATURA}
            subiendo={item.estado === 'enviando'}
            onAbrir={onAbrirImagen}
            onMantener={alMantener}
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
          <Pressable
            onLongPress={alMantener}
            delayLongPress={400}
            accessibilityActions={accionesAccesibles.length > 0 ? accionesAccesibles : undefined}
            onAccessibilityAction={(evento) => alAccionAccesible(evento.nativeEvent.actionName)}
            style={{
              ...(propia ? RADIOS_PROPIA : RADIOS_RECIBIDA),
              ...RELLENO,
              ...(propia ? null : SOMBRA),
              // Con cita, la burbuja va siempre al ancho máximo: si se achicara al largo de la
              // respuesta ("Ok"), la cita quedaría cortada e ilegible. Como en WhatsApp.
              ...(cita ? { width: ANCHO_MAXIMO_BURBUJA } : null),
            }}
            className={`max-w-[80%] ${hayAdjuntos ? 'mt-[5px]' : ''} ${
              propia ? 'bg-organic-accent-600' : 'bg-organic-neutral-100'
            }`}
          >
            {/* La cita va arriba del texto, dentro de la burbuja, como en WhatsApp. */}
            {cita ? <View className="mb-1.5">{cita}</View> : null}

            <Text
              className={`font-cuerpo text-[16px] leading-[22px] ${
                propia ? 'text-white' : 'text-organic-neutral-900'
              }`}
            >
              {item.contenido}
            </Text>

            <PieBurbuja item={item} />
          </Pressable>
        )}

        {/* El error no se traga el mensaje: el texto sigue en la burbuja y se puede reintentar
            sin volver a escribirlo. */}
        {item.estado === 'error' ? (
          <View className="mt-1 flex-row justify-end gap-3">
            <Pressable accessibilityRole="button" onPress={onReintentar} hitSlop={8}>
              <Text className="font-cuerpo-semi text-[12px] text-organic-accent-600">
                Reintentar
              </Text>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onDescartar} hitSlop={8}>
              <Text className="font-cuerpo text-[12px] text-organic-neutral-500">Descartar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </DeslizarParaResponder>
  );
}
