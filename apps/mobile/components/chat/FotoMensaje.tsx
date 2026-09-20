/**
 * Foto de un mensaje (GUI-14, artboard 37): un rectángulo redondeado suelto, SIN burbuja
 * alrededor. Es lo que el diseño nuevo cambió respecto del viejo, donde la foto iba dentro
 * de la burbuja.
 *
 * Medidas del artboard (sobre 262px, ×1,33): radio 15 → 20. El tamaño lo decide quien la
 * pinta: recibida 88 → 117 de lado; propia, alto 104 → 139 y el 76% del ancho disponible.
 *
 * Mientras la foto sube se tapa con un velo y un spinner, y no se puede abrir: la que se
 * vería ampliada es el archivo local, no lo que quedó guardado.
 */
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { PALETA } from '@/constants/theme';

const RADIO = 20;

interface FotoMensajeProps {
  uri: string;
  ancho: number;
  alto: number;
  subiendo: boolean;
  /** Abre la foto a pantalla completa. El visor lo monta la pantalla, no cada foto. */
  onAbrir?: () => void;
}

export function FotoMensaje({ uri, ancho, alto, subiendo, onAbrir }: FotoMensajeProps) {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel="Ver la foto en grande"
      onPress={subiendo ? undefined : onAbrir}
      disabled={subiendo || !onAbrir}
      style={{ width: ancho, height: alto, borderRadius: RADIO }}
      className="overflow-hidden bg-organic-neutral-200 active:opacity-90"
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        accessibilityLabel="Foto del mensaje"
      />

      {subiendo ? (
        <View className="absolute inset-0 items-center justify-center bg-black/35">
          <ActivityIndicator color={PALETA.blanco} />
        </View>
      ) : null}
    </Pressable>
  );
}
