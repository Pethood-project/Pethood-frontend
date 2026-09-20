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
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { BadgeContador } from '@/components/ui/BadgeContador';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { Conversacion } from '@/services/chats';
import { tiempoRelativo } from '@/shared/validation/dates';

/** Lado del avatar en la fila. El diseño lo da en 42px sobre una maqueta de 262px de ancho. */
const AVATAR = 56;
/** Iniciales del avatar: 13px en el artboard. */
const AVATAR_TEXTO = 17;

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
}

export function FilaConversacion({ conversacion, ahora, onPress }: FilaConversacionProps) {
  const { contacto, ultimoMensaje, noLeidos } = conversacion;

  const sinLeer = noLeidos > 0;
  const esSolicitud = ultimoMensaje?.tipo === 'SOLICITUD';
  const soloFoto =
    !esSolicitud && ultimoMensaje?.tieneImagen && ultimoMensaje.contenido.trim() === '';

  // Lo que va en la línea de abajo. La tarjeta de una solicitud y la foto suelta no tienen
  // texto propio: se nombra el hecho, con un ícono adelante para que se lea de un vistazo.
  const preview = esSolicitud
    ? 'Solicitud'
    : soloFoto
      ? 'Foto'
      : (ultimoMensaje?.contenido ?? 'Todavía no hay mensajes');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversación con ${contacto.nombre}${
        sinLeer ? `, ${noLeidos} sin leer` : ''
      }`}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-[13px] px-[21px] py-[15px] ${
        onPress ? 'active:bg-black/5' : ''
      }`}
    >
      {/* `flex-none`: el avatar nunca se achica, por largo que sea el nombre. */}
      <View className="flex-none">
        <Avatar
          uri={urlAbsoluta(contacto.imagenUrl)}
          nombre={contacto.nombre}
          tamanio={AVATAR}
          tamanioTexto={AVATAR_TEXTO}
          variante="organic"
          // El diseño pinta el fondo de las iniciales según quién es el contacto: el
          // acento para un refugio, el neutro para una persona.
          tono={contacto.tipo === 'REFUGIO' ? 'acento' : 'neutro'}
          accessibilityLabel={`Foto de ${contacto.nombre}`}
        />
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
            className="min-w-0 flex-1 font-cuerpo-semi text-[16px] text-organic-neutral-900"
          >
            {contacto.nombre}
          </Text>

          {/* Fuera del bloque que se encoge: la hora conserva su ancho siempre.
              Va sobre `fechaUltimaActividad` y no sobre `ultimoMensaje.fecha` porque el
              contrato la garantiza no nula — en una sala todavía sin mensajes es la fecha
              en que se abrió, y así la fila nunca queda con el hueco de la hora vacío. */}
          <Text className="flex-none font-cuerpo text-[11px] text-organic-neutral-500">
            {tiempoRelativo(new Date(conversacion.fechaUltimaActividad), ahora)}
          </Text>
        </View>

        <View className="mt-[3px] flex-row items-center gap-1">
          {/* "Vos:" sale de `esMio`, que ya manda el backend: el cliente no compara ids. */}
          {ultimoMensaje?.esMio ? (
            <Text className="flex-none font-cuerpo text-[13px] text-organic-neutral-500">
              Vos:
            </Text>
          ) : null}

          {soloFoto ? (
            <Ionicons name="image-outline" size={14} color={PALETA.neutral[500]} />
          ) : null}

          {esSolicitud ? (
            <Ionicons name="document-text-outline" size={14} color={PALETA.neutral[500]} />
          ) : null}

          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            // El diseño pinta el preview oscuro cuando hay mensajes nuevos y apagado cuando
            // ya se leyó: es lo que hace que un chat con novedades pese más en la lista.
            className={`min-w-0 flex-1 font-cuerpo text-[13px] ${
              sinLeer ? 'text-organic-neutral-900' : 'text-organic-neutral-500'
            }`}
          >
            {preview}
          </Text>
        </View>

        {/* El backend manda el hecho (`activo: false`), el texto lo pone la UI. La
            conversación se sigue pudiendo leer; bloquear el envío es de HU-5.2. */}
        {contacto.activo ? null : (
          <Text className="mt-[3px] font-cuerpo text-[11px] italic text-organic-neutral-400">
            Esta cuenta ya no está activa
          </Text>
        )}
      </View>
    </Pressable>
  );
}
