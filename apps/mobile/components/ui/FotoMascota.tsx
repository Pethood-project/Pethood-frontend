/**
 * Foto de una mascota en formato cuadrado redondeado, con la huella gris como respaldo.
 *
 * Es el contrapunto de `Avatar`, que es circular y para personas: en el diseño las mascotas
 * siempre van en cuadrado redondeado (listado de "Mis mascotas", cabecera del seguimiento),
 * así que no se puede reusar aquel.
 *
 * Recibe la url YA absoluta: resolver la ruta relativa de la API es tarea de `urlAbsoluta`.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface FotoMascotaProps {
  /** URL absoluta o uri local. `null` muestra la huella. */
  uri?: string | null;
  /** Lado en px. El radio y el ícono se derivan de acá para que escale parejo. */
  tamanio: number;
  accessibilityLabel?: string;
}

export function FotoMascota({ uri, tamanio, accessibilityLabel }: FotoMascotaProps) {
  // Van por `style` y no por clase: NativeWind no genera clases dinámicas, así que
  // `h-[${n}px]` no compilaría.
  const medidas = { width: tamanio, height: tamanio, borderRadius: Math.round(tamanio * 0.27) };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={medidas}
        accessibilityLabel={accessibilityLabel ?? 'Foto de la mascota'}
      />
    );
  }

  return (
    <View
      style={medidas}
      accessibilityLabel={accessibilityLabel}
      className="items-center justify-center bg-gray-100"
    >
      <Ionicons name="paw-outline" size={Math.round(tamanio * 0.45)} color={PALETA.gris[400]} />
    </View>
  );
}
