/**
 * Foto o logo del refugio: cuadrado de esquinas redondeadas y, sin foto, el ícono de un
 * edificio sobre `accent-600` (artboards 19 y 23). No es `Avatar` a propósito: el círculo
 * con iniciales es de una persona, y en la vista de refugio lo que se muestra es la
 * organización.
 *
 * Recibe la url YA absoluta (`urlAbsoluta`) o una uri local del selector de fotos.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface LogoRefugioProps {
  uri?: string | null;
  /** Lado en px. En el diseño: 52 en el perfil y 64 al editar, escalados ×1,33. */
  tamanio: number;
}

/** Radio sobre el lado: 16 de 52 en el artboard 19. */
const PROPORCION_RADIO = 0.3;

export function LogoRefugio({ uri, tamanio }: LogoRefugioProps) {
  const [uriRota, setUriRota] = useState<string | null>(null);
  const medidas = {
    width: tamanio,
    height: tamanio,
    borderRadius: Math.round(tamanio * PROPORCION_RADIO),
    overflow: 'hidden' as const,
  };

  if (uri && uri !== uriRota) {
    return (
      <Image
        source={{ uri }}
        style={medidas}
        accessibilityLabel="Foto del refugio"
        onError={() => setUriRota(uri)}
      />
    );
  }

  return (
    <View
      style={medidas}
      accessibilityLabel="Refugio sin foto"
      className="items-center justify-center bg-organic-accent-600"
    >
      <Ionicons name="business" size={Math.round(tamanio * 0.46)} color={PALETA.blanco} />
    </View>
  );
}
