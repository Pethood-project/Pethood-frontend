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

const ESTILOS: Record<TonoNota, { icono: keyof typeof Ionicons.glyphMap }> = {
  info: { icono: 'information-circle' },
  consejo: { icono: 'bulb' },
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
  const { icono } = ESTILOS[tono];

  // Amarillo, como la opción de tránsito: un aviso que se distingue del resto sin gritar.
  return (
    <View
      style={{ backgroundColor: PALETA.calido.amarilloClaro, borderColor: PALETA.calido.amarillo }}
      className="flex-row items-start gap-2.5 rounded-2xl border-[1.5px] px-3.5 py-3"
    >
      <Ionicons name={icono} size={grande ? 20 : 16} color={PALETA.accent[700]} style={{ marginTop: 1 }} />
      <View className="flex-1">
        <Text
          className={`font-cuerpo text-organic-accent-900 ${
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
