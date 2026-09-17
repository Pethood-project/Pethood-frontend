/**
 * Barra de escritura de la conversación (GUI-14, criterios 5 y 6): clip, campo y botón de
 * enviar con el avión de papel.
 *
 * El campo crece con el texto hasta un tope y después scrollea: un mensaje largo no puede
 * comerse la conversación entera.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';

import { PALETA } from '@/constants/theme';
import type { ArchivoAdjunto } from '@/services/api';
import { LIMITES } from '@/shared/validation/limits';

/** Diámetro del botón de enviar: 34px del artboard con el factor de conversión de HU-5.1. */
const BOTON = 45;

/** Alto de una línea del campo y tope antes de que empiece a scrollear (unas 5 líneas). */
const ALTO_LINEA = 20;
const ALTO_MINIMO = 22;
const ALTO_MAXIMO = ALTO_LINEA * 5;

interface BarraEscrituraProps {
  /** Foto adjunta a la espera de enviarse, o `null`. */
  foto: ArchivoAdjunto | null;
  onElegirFoto: () => void;
  onQuitarFoto: () => void;
  onEnviar: (contenido: string) => void;
  /** `false` con el contacto dado de baja: se puede leer, no escribir. */
  habilitada: boolean;
}

export function BarraEscritura({
  foto,
  onElegirFoto,
  onQuitarFoto,
  onEnviar,
  habilitada,
}: BarraEscrituraProps) {
  const [texto, setTexto] = useState('');
  const [alto, setAlto] = useState(ALTO_MINIMO);

  // Un mensaje puede ser sólo foto, pero no puede estar vacío: con el campo en blanco (o
  // sólo espacios) y sin adjunto, el botón no hace nada.
  const hayAlgoQueEnviar = texto.trim().length > 0 || foto !== null;
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
    <View className="border-t border-organic-neutral-200 bg-white px-4 py-3">
      {/* Vista previa de la foto elegida: sin esto no habría forma de saber cuál se
          adjuntó ni de arrepentirse antes de mandarla. */}
      {foto ? (
        <View className="mb-2.5 flex-row items-center gap-2.5">
          <Image
            source={{ uri: foto.uri }}
            className="h-14 w-14 rounded-xl"
            accessibilityLabel="Foto que vas a enviar"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar la foto"
            onPress={onQuitarFoto}
            hitSlop={8}
            className="h-7 w-7 items-center justify-center rounded-full bg-organic-neutral-200 active:opacity-70"
          >
            <Ionicons name="close" size={15} color={PALETA.grisCalido[700]} />
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adjuntar una foto"
          onPress={onElegirFoto}
          disabled={!habilitada}
          hitSlop={10}
          className={`pb-2 ${habilitada ? 'active:opacity-60' : 'opacity-40'}`}
        >
          <Ionicons name="attach" size={22} color={PALETA.neutral[500]} />
        </Pressable>

        <View className="min-w-0 flex-1 justify-center rounded-full bg-organic-neutral-200/70 px-4 py-2">
          <TextInput
            value={texto}
            onChangeText={setTexto}
            editable={habilitada}
            multiline
            maxLength={LIMITES.mensaje.contenido.max}
            placeholder={
              habilitada ? 'Escribí un mensaje...' : 'No podés escribirle a esta cuenta'
            }
            placeholderTextColor={PALETA.neutral[400]}
            accessibilityLabel="Mensaje"
            // El alto lo maneja el propio contenido: `multiline` sin esto se queda en una
            // línea en Android y no deja ver lo que se escribió.
            style={{ height: Math.min(Math.max(alto, ALTO_MINIMO), ALTO_MAXIMO) }}
            onContentSizeChange={(evento) => setAlto(evento.nativeEvent.contentSize.height)}
            className="p-0 text-sm text-organic-neutral-900"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !puedeEnviar }}
          onPress={enviar}
          disabled={!puedeEnviar}
          style={{ width: BOTON, height: BOTON, borderRadius: BOTON / 2 }}
          className={`overflow-hidden ${puedeEnviar ? 'active:opacity-85' : 'opacity-40'}`}
        >
          <LinearGradient
            colors={[PALETA.pethood.naranja, PALETA.pethood.naranjaOscuro]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="send" size={21} color={PALETA.blanco} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
