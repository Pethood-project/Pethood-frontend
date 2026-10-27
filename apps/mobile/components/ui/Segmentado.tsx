/**
 * Control segmentado: pocas opciones excluyentes, todas a la vista.
 *
 * Va sin etiqueta a propósito — es el control pelado, para cuando lo que se elige ya se
 * entiende por contexto (las dos vistas de una pantalla, por ejemplo). Con etiqueta,
 * mensaje de error y marca de obligatorio, usar `SegmentedField`, que lo envuelve.
 */
import { Pressable, Text, View } from 'react-native';

import { vibrar } from '@/lib/haptics';

export interface OpcionSegmento<T> {
  valor: T;
  etiqueta: string;
}

export type VarianteSegmentado =
  /** Pastillas pegadas dentro de un riel. Es el segmentado clásico de los formularios. */
  | 'riel'
  /**
   * Botones grandes y separados, del alto de un CTA. Para cuando la elección abre caminos
   * distintos y no es un simple filtro (GUI-7.1.1 paso 1: adoptar o transitar).
   */
  | 'tarjetas'
  /**
   * Riel de la paleta Organic: fondo crema y la opción elegida en `accent-700`. Es el
   * "Perdida / Encontrada" de GUI-25 (pantalla 26 del diseño).
   */
  | 'organica';

const CLASES_RIEL: Record<VarianteSegmentado, { riel: string; opcion: string }> = {
  riel: {
    riel: 'flex-row rounded-2xl border p-1',
    opcion: 'flex-1 items-center rounded-xl py-2.5 active:opacity-80',
  },
  tarjetas: {
    riel: 'flex-row gap-2.5',
    opcion:
      'min-h-[58px] flex-1 items-center justify-center rounded-2xl border px-3 py-3 active:opacity-80',
  },
  organica: {
    riel: 'flex-row gap-1 rounded-[20px] border p-1',
    opcion: 'flex-1 items-center rounded-2xl py-3 active:opacity-80',
  },
};

/** Fondo del riel y colores de cada opción, según la variante y si está elegida. */
function colores(variante: VarianteSegmentado, activa: boolean, conError: boolean) {
  if (variante === 'organica') {
    return {
      riel: conError
        ? 'border-red-300 bg-red-50'
        : 'border-organic-neutral-200 bg-organic-neutral-200',
      opcion: activa ? 'bg-organic-accent-700' : '',
      texto: activa ? 'font-cuerpo-bold text-white' : 'font-cuerpo-semi text-organic-neutral-700',
    };
  }

  if (variante === 'tarjetas') {
    return {
      riel: '',
      opcion: activa
        ? 'border-organic-accent-600 bg-organic-accent-600'
        : 'border-organic-neutral-300 bg-organic-surface',
      texto: activa ? 'font-cuerpo-bold text-white' : 'font-cuerpo-semi text-organic-neutral-700',
    };
  }

  return {
    riel: conError ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50',
    opcion: activa ? 'bg-pethood-orange' : '',
    texto: activa ? 'font-semibold text-white' : 'text-gray-600',
  };
}

interface SegmentadoProps<T> {
  opciones: OpcionSegmento<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  variante?: VarianteSegmentado;
  /** Pinta el riel en rojo cuando el campo que lo contiene tiene un error. */
  conError?: boolean;
  /** Letra más grande, para el alta y la publicación de mascota. */
  grande?: boolean;
}

export function Segmentado<T extends string | number>({
  opciones,
  valor,
  onChange,
  variante = 'riel',
  conError = false,
  grande = false,
}: SegmentadoProps<T>) {
  const clases = CLASES_RIEL[variante];
  // El riel clásico usa la escala de Tailwind; las variantes Organic, tamaños en px.
  const letra =
    variante === 'riel'
      ? grande
        ? 'text-base'
        : 'text-sm'
      : `text-center ${grande ? 'text-[16px]' : 'text-[14px]'}`;

  return (
    <View className={`${clases.riel} ${colores(variante, false, conError).riel}`}>
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;
        const { opcion: fondoOpcion, texto } = colores(variante, activa, conError);

        return (
          <Pressable
            key={String(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            onPress={() => {
              if (!activa) vibrar.seleccion();
              onChange(opcion.valor);
            }}
            className={`${clases.opcion} ${fondoOpcion}`}
          >
            <Text className={`${letra} ${texto}`}>{opcion.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
