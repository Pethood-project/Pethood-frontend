/**
 * Botón redondo de ícono para los encabezados de pantalla. La flecha de volver NO va acá:
 * es `BotonVolver`, suelta y siempre igual.
 *
 * Sin `onPress` se ve igual pero no responde: es el estado de las acciones cuya pantalla
 * todavía no existe, para no romper la fila de íconos con un hueco.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

/**
 * `organic` es el rediseño (Inicio); `neutro`, el mismo rediseño en crema con borde neutro
 * (la flecha de volver del artboard 23); `clasico`, la paleta naranja del resto de la app.
 */
type VarianteBoton = 'organic' | 'neutro' | 'clasico';

/** Amarillo de la marca con borde e ícono en el marrón oscuro: el botón de acción del rediseño. */
const ESTILO_ORGANIC = {
  backgroundColor: PALETA.tabCentral.amarillo,
  borderColor: PALETA.accent[800],
  borderWidth: 1.5,
};

const VARIANTES: Record<
  VarianteBoton,
  { contenedor: string; color: string; tamanoIcono: number; estilo?: object }
> = {
  organic: {
    contenedor: 'h-[42px] w-[42px]',
    color: PALETA.accent[800],
    tamanoIcono: 20,
    estilo: ESTILO_ORGANIC,
  },
  neutro: {
    contenedor: 'h-[42px] w-[42px] border border-organic-neutral-300 bg-organic-neutral-100',
    color: PALETA.neutral[700],
    tamanoIcono: 20,
  },
  clasico: {
    contenedor: 'h-10 w-10 bg-white',
    color: PALETA.pethood.naranja,
    tamanoIcono: 22,
  },
};

/** Mismas variantes, un 20% más grandes: pantallas más densas como Favoritos la piden. */
const VARIANTES_GRANDE: Record<
  VarianteBoton,
  { contenedor: string; color: string; tamanoIcono: number; estilo?: object }
> = {
  organic: {
    contenedor: 'h-[50px] w-[50px]',
    color: PALETA.accent[800],
    tamanoIcono: 24,
    estilo: ESTILO_ORGANIC,
  },
  neutro: {
    contenedor: 'h-[50px] w-[50px] border border-organic-neutral-300 bg-organic-neutral-100',
    color: PALETA.neutral[700],
    tamanoIcono: 24,
  },
  clasico: {
    contenedor: 'h-12 w-12 bg-white',
    color: PALETA.pethood.naranja,
    tamanoIcono: 26,
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
  /** Versión más grande del mismo botón, sin cambiar de variante. */
  grande?: boolean;
}

export function BotonCircular({
  icono,
  etiqueta,
  onPress,
  variante = 'organic',
  contador,
  grande = false,
}: BotonCircularProps) {
  const { contenedor, color, tamanoIcono, estilo } = (grande ? VARIANTES_GRANDE : VARIANTES)[variante];
  const clases = `${contenedor} items-center justify-center rounded-full`;

  const contenido = (
    <>
      <Ionicons name={icono} size={tamanoIcono} color={color} />
      {contador ? (
        <View
          className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1"
          style={{ backgroundColor: PALETA.accent[800] }}
        >
          <Text className="font-cuerpo-bold text-[10px]" style={{ color: PALETA.tabCentral.amarillo }}>
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
      <View
        accessibilityRole="button"
        accessibilityLabel={etiquetaCompleta}
        className={clases}
        style={estilo}
      >
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
      style={estilo}
    >
      {contenido}
    </Pressable>
  );
}
