/**
 * Cabecera de la sala (GUI-14, criterios 1 y 2): retroceso, foto en miniatura, nombre y
 * subtítulo de estado.
 *
 * La flecha va SUELTA, sin el círculo con borde que usan Favoritos o Editar perfil: en este
 * artboard el diseño la pone pelada, junto al avatar.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Pressable } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { ContactoChat } from '@/services/chats';

/** El artboard lo da en 34px sobre una maqueta de 262px, con el mismo factor que HU-5.1. */
const AVATAR = 44;

interface CabeceraConversacionProps {
  contacto: ContactoChat | null;
  enLinea: boolean;
  /** Muestra la franja de "Sin conexión" bajo la cabecera. */
  desconectado: boolean;
  onVolver: () => void;
}

/**
 * Subtítulo de estado. El diseño muestra "En línea"; los otros dos casos no están en el
 * artboard pero el hueco existe igual y dejarlo vacío haría saltar la cabecera.
 *
 * Un refugio nunca figura conectado —es una institución, no una sesión— así que en vez de
 * un "Desconectado" permanente y engañoso se muestra qué es.
 */
function subtitulo(contacto: ContactoChat, enLinea: boolean): { texto: string; color: string } {
  if (!contacto.activo) {
    return { texto: 'Cuenta dada de baja', color: PALETA.neutral[500] };
  }

  if (contacto.tipo === 'REFUGIO') {
    return { texto: 'Refugio', color: PALETA.neutral[500] };
  }

  return enLinea
    ? { texto: 'En línea', color: PALETA.estado.enLinea }
    : { texto: 'Desconectado', color: PALETA.neutral[500] };
}

export function CabeceraConversacion({
  contacto,
  enLinea,
  desconectado,
  onVolver,
}: CabeceraConversacionProps) {
  const estado = contacto ? subtitulo(contacto, enLinea) : null;

  return (
    <View>
      <View className="flex-row items-center gap-3 border-b border-organic-neutral-200 bg-white px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Mensajes"
          onPress={onVolver}
          hitSlop={12}
          className="active:opacity-60"
        >
          <Ionicons name="arrow-back" size={18} color={PALETA.grisCalido[700]} />
        </Pressable>

        <Avatar
          uri={urlAbsoluta(contacto?.imagenUrl)}
          nombre={contacto?.nombre}
          tamanio={AVATAR}
          accessibilityLabel={contacto ? `Foto de ${contacto.nombre}` : 'Foto del contacto'}
        />

        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-base font-semibold text-organic-neutral-900"
          >
            {/* Mientras carga la cabecera no se pone un placeholder con guiones: el hueco
                vacío es menos ruidoso que un texto falso que dura medio segundo. */}
            {contacto?.nombre ?? ''}
          </Text>

          {estado ? (
            <Text style={{ color: estado.color }} className="mt-0.5 text-xs">
              {estado.texto}
            </Text>
          ) : null}
        </View>
      </View>

      {/* GUI-14 no contempla este aviso, pero sin él una conversación sin tiempo real se ve
          idéntica a una que funciona. Es una franja fina y no un bloqueo porque enviar
          sigue andando: el POST es REST y no depende del socket. */}
      {desconectado ? (
        <View className="flex-row items-center justify-center gap-1.5 bg-organic-accent-200 px-4 py-1.5">
          <Ionicons name="cloud-offline-outline" size={13} color={PALETA.accent[800]} />
          <Text className="text-xs text-organic-accent-800">Sin conexión. Reintentando…</Text>
        </View>
      ) : null}
    </View>
  );
}
