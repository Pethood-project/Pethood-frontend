/**
 * Bloque de texto auxiliar con ícono: anticipa lo que va a pasar ("si elegís tránsito te
 * vamos a pedir…") o sugiere cómo completar un campo.
 *
 * No reemplaza al toast ni al error de un campo: esos avisan que algo pasó o que algo está
 * mal, y esto acompaña antes de que el usuario haga nada.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export type TonoNota = 'info' | 'consejo';

const ESTILOS: Record<TonoNota, { icono: keyof typeof Ionicons.glyphMap; color: string }> = {
  info: { icono: 'information-circle-outline', color: PALETA.accent[500] },
  consejo: { icono: 'bulb-outline', color: PALETA.accent[500] },
};

interface NotaProps {
  texto: string;
  tono?: TonoNota;
}

export function Nota({ texto, tono = 'info' }: NotaProps) {
  const { icono, color } = ESTILOS[tono];

  return (
    <View className="flex-row items-start gap-2 rounded-2xl bg-organic-accent-100 px-3.5 py-3">
      <Ionicons name={icono} size={15} color={color} style={{ marginTop: 1 }} />
      <Text className="flex-1 font-cuerpo text-[12.5px] leading-[18px] text-organic-neutral-700">
        {texto}
      </Text>
    </View>
  );
}
