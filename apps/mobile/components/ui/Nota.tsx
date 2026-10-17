/**
 * Bloque de texto auxiliar con ícono: anticipa lo que va a pasar ("si elegís tránsito te
 * vamos a pedir…") o sugiere cómo completar un campo.
 *
 * No reemplaza al toast ni al error de un campo: esos avisan que algo pasó o que algo está
 * mal, y esto acompaña antes de que el usuario haga nada. Puede llevar una acción que
 * resuelve lo que la nota explica (ej. "Permitir ubicación" en GUI-25).
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export type TonoNota = 'info' | 'consejo';

const ESTILOS: Record<TonoNota, { icono: keyof typeof Ionicons.glyphMap; color: string }> = {
  info: { icono: 'information-circle-outline', color: PALETA.accent[500] },
  consejo: { icono: 'bulb-outline', color: PALETA.accent[500] },
};

interface NotaProps {
  texto: string;
  tono?: TonoNota;
  /** Enlace debajo del texto para resolver lo que la nota explica. */
  accion?: { etiqueta: string; onPress: () => void };
  /** Letra más grande, para pantallas de lectura como el detalle de una solicitud. */
  grande?: boolean;
}

export function Nota({ texto, tono = 'info', accion, grande = false }: NotaProps) {
  const { icono, color } = ESTILOS[tono];

  return (
    <View className="flex-row items-start gap-2 rounded-2xl bg-organic-accent-100 px-3.5 py-3">
      <Ionicons name={icono} size={grande ? 19 : 15} color={color} style={{ marginTop: 1 }} />
      <View className="flex-1">
        <Text
          className={`font-cuerpo text-organic-neutral-700 ${
            grande ? 'text-[15px] leading-[21px]' : 'text-[12.5px] leading-[18px]'
          }`}
        >
          {texto}
        </Text>
        {accion ? (
          <Pressable
            accessibilityRole="button"
            onPress={accion.onPress}
            hitSlop={8}
            className="mt-1.5 self-start active:opacity-60"
          >
            <Text className="font-cuerpo-bold text-[13px] text-organic-accent-700">
              {accion.etiqueta}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
