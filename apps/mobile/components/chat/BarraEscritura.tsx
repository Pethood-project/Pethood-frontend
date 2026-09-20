/**
 * Barra de escritura de la conversación (GUI-14, criterios 5 y 6): botón de adjuntar, campo
 * y botón de enviar con el avión de papel. Artboard 35 del diseño Organic.
 *
 * Medidas (sobre 262px, ×1,33): fondo `neutral-100` con borde superior `neutral-300`,
 * padding 9/11 → 12/15, gap 8 → 11; el "+" 18 → 24 en `accent-700`; el campo en píldora
 * sobre `bg` con borde `neutral-300`, padding 8/12 → 11/16 y texto 10 → 13; el botón de
 * enviar 32 → 43, `accent-600` sólido, con el avión 15 → 20 en blanco.
 *
 * El "+" abre la hoja "Enviar en el chat" (`HojaAdjuntos`), que la monta la pantalla: de las
 * cinco opciones del artboard 38 sólo la foto tiene comportamiento, el resto espera su HU.
 *
 * El campo crece con el texto hasta un tope y después scrollea: un mensaje largo no puede
 * comerse la conversación entera.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import type { ArchivoAdjunto } from '@/services/api';
import { LIMITES } from '@/shared/validation/limits';

/** Diámetro del botón de enviar: 32px del artboard con el factor de conversión. */
const BOTON = 43;

/** Alto de una línea del campo y tope antes de que empiece a scrollear (unas 5 líneas). */
const ALTO_LINEA = 20;
const ALTO_MINIMO = 22;
const ALTO_MAXIMO = ALTO_LINEA * 5;

interface BarraEscrituraProps {
  /** Fotos adjuntas a la espera de enviarse. Vacío si el mensaje va sin ninguna. */
  fotos: ArchivoAdjunto[];
  /** Abre la hoja de adjuntos (el botón `+`). */
  onAdjuntar: () => void;
  onQuitarFoto: (indice: number) => void;
  onEnviar: (contenido: string) => void;
  /** `false` con el contacto dado de baja: se puede leer, no escribir. */
  habilitada: boolean;
}

export function BarraEscritura({
  fotos,
  onAdjuntar,
  onQuitarFoto,
  onEnviar,
  habilitada,
}: BarraEscrituraProps) {
  const [texto, setTexto] = useState('');
  const [alto, setAlto] = useState(ALTO_MINIMO);

  // Un mensaje puede ser sólo fotos, pero no puede estar vacío: con el campo en blanco (o
  // sólo espacios) y sin adjuntos, el botón no hace nada.
  const hayAlgoQueEnviar = texto.trim().length > 0 || fotos.length > 0;
  const puedeEnviar = habilitada && hayAlgoQueEnviar;

  const enviar = (): void => {
    if (!puedeEnviar) return;

    onEnviar(texto.trim());

    // El campo se limpia AL ENVIAR y no al confirmar: con el update optimista la burbuja ya
    // está en pantalla, y dejar el texto hasta la respuesta del servidor haría que el
    // usuario lo viera duplicado.
    setTexto('');
    setAlto(ALTO_MINIMO);
  };

  return (
    <View className="border-t border-organic-neutral-300 bg-organic-neutral-100 px-[15px] py-3">
      {/* Vista previa de lo adjuntado: sin esto no habría forma de saber qué se eligió ni
          de arrepentirse antes de mandarlo. Cada una se quita por separado. */}
      {fotos.length > 0 ? (
        <View className="mb-2.5 flex-row flex-wrap gap-2.5">
          {fotos.map((foto, indice) => (
            <View key={`${foto.uri}-${indice}`}>
              <Image
                source={{ uri: foto.uri }}
                className="h-14 w-14 rounded-[14px]"
                accessibilityLabel={`Foto ${indice + 1} que vas a enviar`}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar la foto ${indice + 1}`}
                onPress={() => onQuitarFoto(indice)}
                hitSlop={8}
                className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full border border-organic-neutral-300 bg-organic-neutral-100 active:opacity-70"
              >
                <Ionicons name="close" size={13} color={PALETA.neutral[700]} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-end gap-[11px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar en el chat"
          onPress={onAdjuntar}
          disabled={!habilitada}
          hitSlop={10}
          // Centrado con el campo de una línea; con varias líneas se queda abajo, junto al
          // botón de enviar.
          className={`pb-[10px] ${habilitada ? 'active:opacity-60' : 'opacity-40'}`}
        >
          <Ionicons name="add" size={24} color={PALETA.accent[700]} />
        </Pressable>

        <View className="min-w-0 flex-1 justify-center rounded-full border border-organic-neutral-300 bg-organic-bg px-4 py-[11px]">
          <TextInput
            value={texto}
            onChangeText={setTexto}
            editable={habilitada}
            multiline
            maxLength={LIMITES.mensaje.contenido.max}
            placeholder={
              habilitada ? 'Escribí un mensaje...' : 'No podés escribirle a esta cuenta'
            }
            placeholderTextColor={PALETA.neutral[500]}
            accessibilityLabel="Mensaje"
            // El alto lo maneja el propio contenido: `multiline` sin esto se queda en una
            // línea en Android y no deja ver lo que se escribió.
            style={{ height: Math.min(Math.max(alto, ALTO_MINIMO), ALTO_MAXIMO) }}
            onContentSizeChange={(evento) => setAlto(evento.nativeEvent.contentSize.height)}
            className="p-0 font-cuerpo text-[13px] text-organic-neutral-900"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !puedeEnviar }}
          onPress={enviar}
          disabled={!puedeEnviar}
          style={{ width: BOTON, height: BOTON, borderRadius: BOTON / 2 }}
          className={`items-center justify-center bg-organic-accent-600 ${
            puedeEnviar ? 'active:opacity-85' : 'opacity-40'
          }`}
        >
          <Ionicons name="send" size={20} color={PALETA.blanco} />
        </Pressable>
      </View>
    </View>
  );
}
