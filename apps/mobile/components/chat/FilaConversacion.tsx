/**
 * Una fila del listado de conversaciones (GUI-08 / GUI-31 — HU-5.1, criterios 3 a 6).
 *
 * Las dos pantallas comparten esta fila sin ninguna diferencia: lo único que cambia entre
 * adoptante y refugio es la cabecera.
 *
 * Layout: el avatar y la hora tienen ancho fijo y el bloque de texto es el que cede — así un
 * nombre largo se trunca con elipsis (criterios 4 y 5) sin empujar ni comprimir la hora ni
 * el badge. El `min-w-0` es lo que habilita ese encogido dentro de un flex row.
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
  const soloFoto = ultimoMensaje?.tieneImagen && ultimoMensaje.contenido.trim() === '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversación con ${contacto.nombre}${
        sinLeer ? `, ${noLeidos} sin leer` : ''
      }`}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-3 border-b border-organic-neutral-200 px-4 py-3 ${
        onPress ? 'active:bg-black/5' : ''
      }`}
    >
      {/* `flex-none`: el avatar nunca se achica, por largo que sea el nombre. */}
      <View className="flex-none">
        <Avatar
          uri={urlAbsoluta(contacto.imagenUrl)}
          nombre={contacto.nombre}
          tamanio={AVATAR}
          accessibilityLabel={`Foto de ${contacto.nombre}`}
        />
        <BadgeContador
          cantidad={noLeidos}
          accessibilityLabel={`${noLeidos} mensajes sin leer`}
        />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="min-w-0 flex-1 text-base font-semibold text-organic-neutral-900"
          >
            {contacto.nombre}
          </Text>

          {/* Fuera del bloque que se encoge: la hora conserva su ancho siempre.
              Va sobre `fechaUltimaActividad` y no sobre `ultimoMensaje.fecha` porque el
              contrato la garantiza no nula — en una sala todavía sin mensajes es la fecha
              en que se abrió, y así la fila nunca queda con el hueco de la hora vacío. */}
          <Text className="flex-none text-xs text-organic-neutral-500">
            {tiempoRelativo(new Date(conversacion.fechaUltimaActividad), ahora)}
          </Text>
        </View>

        <View className="mt-0.5 flex-row items-center gap-1">
          {/* "Vos:" sale de `esMio`, que ya manda el backend: el cliente no compara ids. */}
          {ultimoMensaje?.esMio ? (
            <Text className="flex-none text-sm text-organic-neutral-500">Vos:</Text>
          ) : null}

          {soloFoto ? (
            <Ionicons name="image-outline" size={14} color={PALETA.neutral[500]} />
          ) : null}

          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            // El diseño pinta el preview oscuro cuando hay mensajes nuevos y apagado cuando
            // ya se leyó: es lo que hace que un chat con novedades pese más en la lista.
            className={`min-w-0 flex-1 text-sm ${
              sinLeer ? 'text-organic-neutral-900' : 'text-organic-neutral-500'
            }`}
          >
            {soloFoto ? 'Foto' : (ultimoMensaje?.contenido ?? 'Todavía no hay mensajes')}
          </Text>
        </View>

        {/* El backend manda el hecho (`activo: false`), el texto lo pone la UI. La
            conversación se sigue pudiendo leer; bloquear el envío es de HU-5.2. */}
        {contacto.activo ? null : (
          <Text className="mt-0.5 text-xs italic text-organic-neutral-400">
            Esta cuenta ya no está activa
          </Text>
        )}
      </View>
    </Pressable>
  );
}
