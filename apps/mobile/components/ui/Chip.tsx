/**
 * Pastilla redondeada. Es la base de todo lo que en la app se ve como "chip": etiquetas de
 * personalidad, filtros de selección única y opciones de selección múltiple.
 *
 * Sin `onPress` se renderiza como texto suelto; con `onPress` pasa a ser interactiva y hay
 * que decirle qué rol de accesibilidad cumple.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export type VarianteChip =
  /** Etiqueta informativa sobre fondo claro. */
  | 'suave'
  /** Etiqueta informativa encima de una foto: translúcida y con texto blanco. */
  | 'sobre-imagen'
  /** Opción de selección única: se rellena de naranja cuando está activa. */
  | 'seleccion'
  /** Opción de selección múltiple: al activarse muestra un tilde. */
  | 'multiple'
  /**
   * Opción de selección única con la paleta Organic de la pantalla 33 (Filtros avanzados):
   * activa, rellena en acento con texto blanco; inactiva, crema con borde.
   */
  | 'filtro';

interface EstiloChip {
  contenedor: string;
  texto: string;
}

/** Clases por variante y estado. Tenerlas juntas evita que cada pantalla invente la suya. */
const ESTILOS: Record<VarianteChip, { activa: EstiloChip; inactiva: EstiloChip }> = {
  suave: {
    activa: { contenedor: 'bg-orange-50', texto: 'text-pethood-orange-dark font-medium' },
    inactiva: { contenedor: 'bg-orange-50', texto: 'text-pethood-orange-dark font-medium' },
  },
  'sobre-imagen': {
    activa: {
      contenedor: 'border border-white/35 bg-white/[0.18]',
      texto: 'text-white font-cuerpo-semi',
    },
    inactiva: {
      contenedor: 'border border-white/35 bg-white/[0.18]',
      texto: 'text-white font-cuerpo-semi',
    },
  },
  seleccion: {
    activa: {
      contenedor: 'border border-pethood-orange bg-pethood-orange',
      texto: 'text-white font-semibold',
    },
    inactiva: { contenedor: 'border border-gray-200 bg-white', texto: 'text-gray-600' },
  },
  multiple: {
    activa: {
      contenedor: 'border border-pethood-orange bg-pethood-orange/10',
      texto: 'text-pethood-orange-dark font-semibold',
    },
    inactiva: { contenedor: 'border border-gray-200 bg-white', texto: 'text-gray-600' },
  },
  filtro: {
    activa: {
      contenedor: 'border border-organic-accent-600 bg-organic-accent-600',
      texto: 'text-white font-cuerpo-bold',
    },
    inactiva: {
      contenedor: 'border border-organic-neutral-300 bg-organic-neutral-100',
      texto: 'text-organic-neutral-700 font-cuerpo',
    },
  },
};

/** Las etiquetas sobre foto son más chicas para no tapar la imagen. */
const TAMANIOS: Record<VarianteChip, string> = {
  suave: 'px-3 py-1.5',
  'sobre-imagen': 'px-3 py-1',
  seleccion: 'px-4 py-2',
  multiple: 'px-3 py-1.5',
  filtro: 'px-4 py-2',
};

const TAMANIOS_TEXTO: Record<VarianteChip, string> = {
  suave: 'text-[13px]',
  'sobre-imagen': 'text-[11.5px]',
  seleccion: 'text-sm',
  multiple: 'text-sm',
  filtro: 'text-sm',
};

/** Un escalón más grande, para el alta y la publicación de mascota. */
const TAMANIOS_TEXTO_GRANDE: Record<VarianteChip, string> = {
  suave: 'text-[15px]',
  'sobre-imagen': 'text-[13.5px]',
  seleccion: 'text-base',
  multiple: 'text-base',
  filtro: 'text-base',
};

export interface ChipProps {
  etiqueta: string;
  variante?: VarianteChip;
  /** Solo lo miran las variantes interactivas. */
  activa?: boolean;
  deshabilitada?: boolean;
  onPress?: () => void;
  /** Obligatorio cuando hay `onPress`: define cómo lo anuncia el lector de pantalla. */
  rol?: 'radio' | 'checkbox';
  /** Letra más grande, para el alta y la publicación de mascota. */
  grande?: boolean;
  /**
   * Chip de filtro: más relleno y letra más grande que `grande`, con un alto mínimo de 44 px
   * para que se toque sin errarle. Lo usan los filtros por estado del refugio.
   */
  amplio?: boolean;
}

export function Chip({
  etiqueta,
  variante = 'suave',
  activa = false,
  deshabilitada = false,
  onPress,
  rol = 'radio',
  grande = false,
  amplio = false,
}: ChipProps) {
  const estilo = activa ? ESTILOS[variante].activa : ESTILOS[variante].inactiva;
  const relleno = amplio ? 'min-h-[44px] gap-1.5 px-5 py-2.5' : `gap-1 ${TAMANIOS[variante]}`;
  const clases = `flex-row items-center self-start rounded-full ${relleno} ${estilo.contenedor}`;
  const tamanioTexto = amplio
    ? 'text-[17px]'
    : grande
      ? TAMANIOS_TEXTO_GRANDE[variante]
      : TAMANIOS_TEXTO[variante];
  const texto = <Text className={`${tamanioTexto} ${estilo.texto}`}>{etiqueta}</Text>;
  const tamanioTilde = amplio ? 18 : grande ? 15 : 13;

  // El tilde solo tiene sentido en la selección múltiple: en la única ya lo dice el relleno.
  const contenido = (
    <>
      {variante === 'multiple' && activa ? (
        <Ionicons name="checkmark" size={tamanioTilde} color={PALETA.pethood.naranjaIntensa} />
      ) : null}
      {texto}
    </>
  );

  if (!onPress) {
    return <View className={clases}>{contenido}</View>;
  }

  return (
    <Pressable
      accessibilityRole={rol}
      accessibilityState={
        rol === 'checkbox'
          ? { checked: activa, disabled: deshabilitada }
          : { selected: activa, disabled: deshabilitada }
      }
      onPress={deshabilitada ? undefined : onPress}
      className={`${clases} active:opacity-80 ${deshabilitada ? 'opacity-40' : ''}`}
    >
      {contenido}
    </Pressable>
  );
}
