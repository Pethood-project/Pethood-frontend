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
  | 'multiple';

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
};

/** Las etiquetas sobre foto son más chicas para no tapar la imagen. */
const TAMANIOS: Record<VarianteChip, string> = {
  suave: 'px-3 py-1.5',
  'sobre-imagen': 'px-3 py-1',
  seleccion: 'px-4 py-2',
  multiple: 'px-3 py-1.5',
};

const TAMANIOS_TEXTO: Record<VarianteChip, string> = {
  suave: 'text-[13px]',
  'sobre-imagen': 'text-[11.5px]',
  seleccion: 'text-sm',
  multiple: 'text-sm',
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
}

export function Chip({
  etiqueta,
  variante = 'suave',
  activa = false,
  deshabilitada = false,
  onPress,
  rol = 'radio',
}: ChipProps) {
  const estilo = activa ? ESTILOS[variante].activa : ESTILOS[variante].inactiva;
  const clases = `flex-row items-center gap-1 self-start rounded-full ${TAMANIOS[variante]} ${estilo.contenedor}`;
  const texto = (
    <Text className={`${TAMANIOS_TEXTO[variante]} ${estilo.texto}`}>{etiqueta}</Text>
  );

  // El tilde solo tiene sentido en la selección múltiple: en la única ya lo dice el relleno.
  const contenido = (
    <>
      {variante === 'multiple' && activa ? (
        <Ionicons name="checkmark" size={13} color={PALETA.pethood.naranjaIntensa} />
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
