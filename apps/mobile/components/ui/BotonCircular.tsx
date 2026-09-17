/**
 * Botón redondo de ícono para los encabezados de pantalla.
 *
 * Sin `onPress` se ve igual pero no responde: es el estado de las acciones cuya pantalla
 * todavía no existe, para no romper la fila de íconos con un hueco.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/** `organic` es el rediseño (Inicio); `clasico`, la paleta naranja del resto de la app. */
type VarianteBoton = 'organic' | 'clasico';

const VARIANTES: Record<
  VarianteBoton,
  { contenedor: string; color: string; tamanoIcono: number }
> = {
  organic: {
    contenedor: 'h-[42px] w-[42px] border border-organic-accent-300 bg-organic-accent-100',
    color: PALETA.accent[700],
    tamanoIcono: 19,
  },
  clasico: {
    contenedor: 'h-10 w-10 bg-white',
    color: PALETA.pethood.naranja,
    tamanoIcono: 22,
  },
};

interface BotonCircularProps {
  icono: NombreIcono;
  /** Se lee en voz alta y describe la acción, no el ícono. */
  etiqueta: string;
  onPress?: () => void;
  variante?: VarianteBoton;
  /** Pastilla con un número sobre el ícono. En cero o sin valor no se dibuja. */
  contador?: number;
}

export function BotonCircular({
  icono,
  etiqueta,
  onPress,
  variante = 'organic',
  contador,
}: BotonCircularProps) {
  const { contenedor, color, tamanoIcono } = VARIANTES[variante];
  const clases = `${contenedor} items-center justify-center rounded-full`;

  const contenido = (
    <>
      <Ionicons name={icono} size={tamanoIcono} color={color} />
      {contador ? (
        <View
          className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1"
          style={{ backgroundColor: PALETA.accent[600] }}
        >
          <Text className="font-cuerpo-bold text-[10px]" style={{ color: PALETA.accent[100] }}>
            {contador}
          </Text>
        </View>
      ) : null}
    </>
  );

  // El contador ya viaja en la etiqueta: quien usa lector de pantalla no ve la pastilla.
  const etiquetaCompleta = contador ? `${etiqueta}, ${contador} activos` : etiqueta;

  if (!onPress) {
    return (
      <View accessibilityRole="button" accessibilityLabel={etiquetaCompleta} className={clases}>
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaCompleta}
      onPress={onPress}
      className={`${clases} active:opacity-70`}
    >
      {contenido}
    </Pressable>
  );
}
