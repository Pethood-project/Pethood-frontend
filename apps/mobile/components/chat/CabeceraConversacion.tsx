/**
 * Cabecera de la sala (GUI-14, criterios 1 y 2): retroceso, foto en miniatura, nombre y
 * subtítulo de estado. Artboard 35 del diseño Organic.
 *
 * La flecha va SUELTA, sin el círculo con borde que usan Favoritos o Solicitudes: en este
 * artboard el diseño la pone pelada, junto al avatar.
 *
 * Medidas (sobre 262px, ×1,33): fondo `neutral-100` con borde inferior `neutral-300`,
 * padding 9/12 → 12/16, gap 9 → 12, flecha 18 → 24 en `neutral-700`, avatar 34 → 44 con las
 * iniciales en Caprasimo 12 → 16, nombre 12 → 16 semibold, subtítulo 8.5 → 11 en
 * `neutral-600`.
 *
 * El botón "Detalles" del artboard no se implementa: no hay pantalla a la que llevar.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Pressable } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PALETA } from '@/constants/theme';
import { urlAbsoluta } from '@/services/api';
import type { ContactoChat, SolicitudEnChat } from '@/services/chats';

const AVATAR = 44;
const AVATAR_TEXTO = 16;

interface CabeceraConversacionProps {
  contacto: ContactoChat | null;
  enLinea: boolean;
  /** En cuántos minutos suele responder el contacto, o `null` si no hay tendencia. */
  minutosRespuesta?: number | null;
  /** La solicitud que abrió la sala, si la hay: manda sobre el estado en el subtítulo. */
  solicitud?: SolicitudEnChat | null;
  /** Muestra la franja de "Sin conexión" bajo la cabecera. */
  desconectado: boolean;
  onVolver: () => void;
}

/**
 * "responde en ~2 h" a partir de los minutos que manda el backend.
 *
 * Redondea a la unidad de arriba a propósito: quien lee está calculando cuánto va a esperar,
 * y prometer menos de lo que suele tardar es peor que prometer de más.
 */
function textoRespuesta(minutos: number): string {
  if (minutos < 60) return `responde en ~${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `responde en ~${horas} ${horas === 1 ? 'hora' : 'horas'}`;

  const dias = Math.round(horas / 24);
  return `responde en ~${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/**
 * Subtítulo de estado. El diseño muestra "En línea"; los otros dos casos no están en el
 * artboard pero el hueco existe igual y dejarlo vacío haría saltar la cabecera.
 *
 * Un refugio nunca figura conectado —es una institución, no una sesión— así que en vez de
 * un "Desconectado" permanente y engañoso se muestra qué es.
 */
function subtitulo(
  contacto: ContactoChat,
  enLinea: boolean,
  minutosRespuesta: number | null,
  solicitud: SolicitudEnChat | null,
): string {
  if (!contacto.activo) return 'Cuenta dada de baja';

  // Con una solicitud de por medio, de qué se está hablando importa más que la presencia:
  // es el subtítulo del artboard 36.
  if (solicitud) {
    const mascota = solicitud.mascota.nombre;
    return `Solicitud #${solicitud.id}${mascota ? ` · ${mascota}` : ''}`;
  }

  const estado =
    contacto.tipo === 'REFUGIO' ? 'Refugio' : enLinea ? 'En línea' : 'Desconectado';

  // "En línea · responde en ~2 h" del artboard 35. El tiempo se agrega sólo cuando el
  // backend pudo calcularlo: con pocas respuestas manda `null` y no se inventa nada.
  return minutosRespuesta === null ? estado : `${estado} · ${textoRespuesta(minutosRespuesta)}`;
}

export function CabeceraConversacion({
  contacto,
  enLinea,
  minutosRespuesta = null,
  solicitud = null,
  desconectado,
  onVolver,
}: CabeceraConversacionProps) {
  return (
    <View>
      <View className="flex-row items-center gap-3 border-b border-organic-neutral-300 bg-organic-neutral-100 px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Mensajes"
          onPress={onVolver}
          hitSlop={12}
          className="active:opacity-60"
        >
          <Ionicons name="arrow-back" size={24} color={PALETA.neutral[700]} />
        </Pressable>

        <Avatar
          uri={urlAbsoluta(contacto?.imagenUrl)}
          nombre={contacto?.nombre}
          tamanio={AVATAR}
          tamanioTexto={AVATAR_TEXTO}
          variante="organic"
          tono={contacto?.tipo === 'REFUGIO' ? 'acento' : 'neutro'}
          accessibilityLabel={contacto ? `Foto de ${contacto.nombre}` : 'Foto del contacto'}
        />

        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="font-cuerpo-semi text-[16px] text-organic-neutral-900"
          >
            {/* Mientras carga la cabecera no se pone un placeholder con guiones: el hueco
                vacío es menos ruidoso que un texto falso que dura medio segundo. */}
            {contacto?.nombre ?? ''}
          </Text>

          {contacto ? (
            <Text numberOfLines={1} className="font-cuerpo text-[11px] text-organic-neutral-600">
              {subtitulo(contacto, enLinea, minutosRespuesta, solicitud)}
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
          <Text className="font-cuerpo text-[12px] text-organic-accent-800">
            Sin conexión. Reintentando…
          </Text>
        </View>
      ) : null}
    </View>
  );
}
