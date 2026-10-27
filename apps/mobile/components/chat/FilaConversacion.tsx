/**
 * Una fila del listado de conversaciones (GUI-08 / GUI-31 — HU-5.1, criterios 3 a 6).
 *
 * Las dos pantallas comparten esta fila sin ninguna diferencia: lo único que cambia entre
 * adoptante y refugio es la cabecera.
 *
 * Layout: el avatar y la hora tienen ancho fijo y el bloque de texto es el que cede — así un
 * nombre largo se trunca con elipsis (criterios 4 y 5) sin empujar ni comprimir la hora ni
 * el badge. El `min-w-0` es lo que habilita ese encogido dentro de un flex row.
 *
 * Medidas del artboard 07/18 del diseño Organic (sobre una maqueta de 262px, ×1,33): gap
 * 10 → 13, padding 11/16 → 15/21, avatar 42 → 56, nombre 12 → 16, hora 8.5 → 11, preview
 * 10 → 13. El separador entre filas lo pone la lista (`ItemSeparatorComponent`), no la fila:
 * en el diseño la última no lleva línea debajo.
 *
 * Además de abrir la conversación: tocar la foto la amplía, mantener apretada la fila abre las
 * opciones del contacto y deslizarla a la izquierda deja el botón de reportar. Los tres los
 * resuelve la pantalla; la fila sólo avisa.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Avatar } from '@/components/ui/Avatar';
import { BadgeContador } from '@/components/ui/BadgeContador';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { Conversacion, TipoMensaje } from '@/services/chats';
import { tiempoRelativo } from '@/shared/validation/dates';

/** Lado del avatar en la fila. El diseño lo da en 42px sobre una maqueta de 262px de ancho. */
const AVATAR = 46;
/** Iniciales del avatar: 13px en el artboard. */
const AVATAR_TEXTO = 15;

/**
 * Lo que dice la fila cuando lo último de la sala es una tarjeta: no tiene texto propio, así
 * que se nombra el hecho con un ícono adelante, igual que una foto suelta.
 */
const PREVIEW_DE_TARJETA: Partial<
  Record<TipoMensaje, { texto: string; icono: keyof typeof Ionicons.glyphMap }>
> = {
  SOLICITUD: { texto: 'Solicitud', icono: 'document-text-outline' },
  ANIMAL_PERDIDO: { texto: 'Mascota perdida', icono: 'paw-outline' },
  MASCOTA: { texto: 'Mascota compartida', icono: 'heart-outline' },
  UBICACION_REFUGIO: { texto: 'Ubicación del refugio', icono: 'location-outline' },
};

interface FilaConversacionProps {
  conversacion: Conversacion;
  /** Instante contra el que se calcula el texto relativo. Lo refresca la pantalla. */
  ahora: Date;
  /**
   * Navegación a la conversación (GUI-14, HU-5.2). Sigue siendo opcional: sin ella la fila
   * no da feedback de pulsación, porque un destello que no lleva a ningún lado se lee como
   * un bug.
   */
  onPress?: () => void;
  /**
   * Deslizar la fila hacia la izquierda deja a la vista el botón «Reportar» (spec 008). Sin
   * esto la fila no se desliza.
   */
  onReportar?: () => void;
  /**
   * Tocar la foto del contacto: verla en grande. Sólo con foto cargada; sobre las iniciales
   * el toque sigue abriendo la conversación, como el resto de la fila.
   */
  onVerFoto?: () => void;
  /** Mantener apretada la fila: las opciones del contacto (ver perfil, reportar). */
  onMantener?: () => void;
}

export function FilaConversacion({
  conversacion,
  ahora,
  onPress,
  onReportar,
  onVerFoto,
  onMantener,
}: FilaConversacionProps) {
  const swipeable = useRef<SwipeableMethods>(null);
  const { contacto, ultimoMensaje, noLeidos } = conversacion;

  const sinLeer = noLeidos > 0;
  // `=== true`: un backend anterior a la eliminación de mensajes no manda el campo.
  const eliminado = ultimoMensaje?.eliminado === true;
  // Las tarjetas vienen sin texto propio, así que ninguna cuenta como adjunto suelto.
  const tarjeta = ultimoMensaje ? PREVIEW_DE_TARJETA[ultimoMensaje.tipo] : undefined;
  const soloAdjunto =
    !tarjeta &&
    !eliminado &&
    ultimoMensaje?.tieneImagen &&
    ultimoMensaje.contenido.trim() === '';

  // `tieneVideo` viaja aparte de `tieneImagen`, que sigue en `true` con un video: así un
  // cliente que no conociera el campo nuevo mostraría "Foto" y no una línea vacía.
  const soloVideo = soloAdjunto && ultimoMensaje.tieneVideo;

  // Lo que va en la línea de abajo. Las tarjetas y el adjunto suelto no tienen texto propio:
  // se nombra el hecho, con un ícono adelante para que se lea de un vistazo.
  // Un eliminado propio lo dice en primera persona, como la burbuja; por eso tampoco lleva
  // el "Vos:" adelante.
  const preview = eliminado
    ? ultimoMensaje?.esMio
      ? 'Eliminaste este mensaje'
      : 'Se eliminó este mensaje'
    : tarjeta
      ? tarjeta.texto
      : soloVideo
        ? 'Video'
        : soloAdjunto
          ? 'Foto'
          : (ultimoMensaje?.contenido ?? 'Todavía no hay mensajes');

  const foto = urlAbsoluta(contacto.imagenUrl);

  const avatar = (
    <Avatar
      uri={foto}
      nombre={contacto.nombre}
      tamanio={AVATAR}
      tamanioTexto={AVATAR_TEXTO}
      variante="organic"
      // El diseño pinta el fondo de las iniciales según quién es el contacto: el
      // acento para un refugio, el neutro para una persona.
      tono={contacto.tipo === 'REFUGIO' ? 'acento' : 'neutro'}
      accessibilityLabel={`Foto de ${contacto.nombre}`}
    />
  );

  const fila = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversación con ${contacto.nombre}${
        sinLeer ? `, ${noLeidos} sin leer` : ''
      }`}
      accessibilityHint={onMantener ? 'Mantené apretado para ver más opciones' : undefined}
      onPress={onPress}
      onLongPress={onMantener}
      delayLongPress={400}
      disabled={!onPress && !onMantener}
      className={`flex-row items-center gap-[11px] px-[18px] py-[8px] ${
        onPress ? 'active:bg-black/5' : ''
      }`}
    >
      {/* `flex-none`: el avatar nunca se achica, por largo que sea el nombre. */}
      <View className="flex-none">
        {/* La foto tiene su propio toque —verla en grande— y le gana a la fila por estar
            adentro. Sin foto no hay nada que ampliar: el toque sigue de largo a la fila. */}
        {foto && onVerFoto ? (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={`Ver la foto de ${contacto.nombre}`}
            onPress={onVerFoto}
            onLongPress={onMantener}
            delayLongPress={400}
            hitSlop={4}
            className="active:opacity-80"
          >
            {avatar}
          </Pressable>
        ) : (
          avatar
        )}
        <BadgeContador
          cantidad={noLeidos}
          accessibilityLabel={`${noLeidos} mensajes sin leer`}
        />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="min-w-0 flex-1 font-cuerpo-semi text-[18px] text-organic-neutral-900"
          >
            {contacto.nombre}
          </Text>

          {/* Fuera del bloque que se encoge: la hora conserva su ancho siempre.
              Va sobre `fechaUltimaActividad` y no sobre `ultimoMensaje.fecha` porque el
              contrato la garantiza no nula — en una sala todavía sin mensajes es la fecha
              en que se abrió, y así la fila nunca queda con el hueco de la hora vacío. */}
          <Text className="flex-none font-cuerpo text-[15px] text-organic-neutral-500">
            {tiempoRelativo(new Date(conversacion.fechaUltimaActividad), ahora)}
          </Text>
        </View>

        <View className="mt-[3px] flex-row items-center gap-1">
          {/* "Vos:" sale de `esMio`, que ya manda el backend: el cliente no compara ids. */}
          {ultimoMensaje?.esMio && !eliminado ? (
            <Text className="flex-none font-cuerpo text-[15px] text-organic-neutral-500">
              Vos:
            </Text>
          ) : null}

          {soloAdjunto ? (
            <Ionicons
              name={soloVideo ? 'videocam-outline' : 'image-outline'}
              size={16}
              color={PALETA.neutral[500]}
            />
          ) : null}

          {tarjeta && !eliminado ? (
            <Ionicons name={tarjeta.icono} size={16} color={PALETA.neutral[500]} />
          ) : null}

          {eliminado ? (
            <Ionicons name="ban-outline" size={15} color={PALETA.neutral[500]} />
          ) : null}

          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            // El diseño pinta el preview oscuro cuando hay mensajes nuevos y apagado cuando
            // ya se leyó: es lo que hace que un chat con novedades pese más en la lista.
            className={`min-w-0 flex-1 font-cuerpo text-[15px] ${
              sinLeer ? 'text-organic-neutral-900' : 'text-organic-neutral-500'
            } ${eliminado ? 'italic' : ''}`}
          >
            {preview}
          </Text>
        </View>

        {/* El backend manda el hecho (`activo: false`), el texto lo pone la UI. La
            conversación se sigue pudiendo leer; bloquear el envío es de HU-5.2. */}
        {contacto.activo ? null : (
          <Text className="mt-[3px] font-cuerpo text-[13px] italic text-organic-neutral-400">
            Esta cuenta ya no está activa
          </Text>
        )}
      </View>
    </Pressable>
  );

  if (!onReportar) return fila;

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reportar a ${contacto.nombre}`}
          onPress={() => {
            swipeable.current?.close();
            onReportar();
          }}
          className="w-24 items-center justify-center gap-1 border-l border-red-200 bg-red-50 active:opacity-70"
        >
          <Ionicons name="flag-outline" size={22} color={PALETA.estado.error} />
          <Text className="font-cuerpo-semi text-[13px]" style={{ color: PALETA.estado.error }}>
            Reportar
          </Text>
        </Pressable>
      )}
    >
      {/* Fondo propio: sin él, la acción de atrás se vería a través de la fila. */}
      <View className="bg-organic-bg">{fila}</View>
    </ReanimatedSwipeable>
  );
}
