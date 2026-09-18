/**
 * Línea de estado FUERA de la burbuja (GUI-14, artboards 35 y 37). Dos usos:
 *
 * - `derecha`: bajo una foto propia, "Enviaste una foto · 16:10" con el doble tilde al final.
 * - `centro`: al pie de la conversación, "Visto" con el doble tilde adelante.
 *
 * El doble tilde sólo se pinta si el otro leyó (`leido`). El diseño no muestra un tilde
 * simple para lo no leído, así que acá tampoco: el texto va igual, sin ícono.
 *
 * Medidas del artboard (sobre 262px, ×1,33): texto `neutral-600` de 8 → 11, ícono 11 → 15
 * en `accent-600`, separación 4–5 → 5–7.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface PieMensajeProps {
  texto: string;
  leido: boolean;
  alineacion: 'derecha' | 'centro';
}

export function PieMensaje({ texto, leido, alineacion }: PieMensajeProps) {
  const tilde = leido ? (
    <Ionicons name="checkmark-done" size={15} color={PALETA.accent[600]} />
  ) : null;

  return (
    <View
      className={`flex-row items-center ${
        alineacion === 'centro' ? 'justify-center gap-[7px]' : 'justify-end gap-[5px]'
      }`}
    >
      {alineacion === 'centro' ? tilde : null}
      <Text className="font-cuerpo text-[11px] text-organic-neutral-600">{texto}</Text>
      {alineacion === 'derecha' ? tilde : null}
    </View>
  );
}
