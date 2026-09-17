/**
 * Control segmentado: pocas opciones excluyentes, todas a la vista.
 *
 * Va sin etiqueta a propósito — es el control pelado, para cuando lo que se elige ya se
 * entiende por contexto (las dos vistas de una pantalla, por ejemplo). Con etiqueta,
 * mensaje de error y marca de obligatorio, usar `SegmentedField`, que lo envuelve.
 */
import { Pressable, Text, View } from 'react-native';

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
  | 'tarjetas';

interface SegmentadoProps<T> {
  opciones: OpcionSegmento<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  variante?: VarianteSegmentado;
  /** Pinta el riel en rojo cuando el campo que lo contiene tiene un error. */
  conError?: boolean;
}

export function Segmentado<T extends string | number>({
  opciones,
  valor,
  onChange,
  variante = 'riel',
  conError = false,
}: SegmentadoProps<T>) {
  const esRiel = variante === 'riel';

  return (
    <View
      className={
        esRiel
          ? `flex-row rounded-2xl border p-1 ${
              conError ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'
            }`
          : 'flex-row gap-2.5'
      }
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;

        return (
          <Pressable
            key={String(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            onPress={() => onChange(opcion.valor)}
            className={
              esRiel
                ? `flex-1 items-center rounded-xl py-2.5 active:opacity-80 ${
                    activa ? 'bg-pethood-orange' : ''
                  }`
                : `min-h-[58px] flex-1 items-center justify-center rounded-2xl border px-3 py-3 active:opacity-80 ${
                    activa
                      ? 'border-organic-accent-600 bg-organic-accent-600'
                      : 'border-organic-neutral-300 bg-organic-surface'
                  }`
            }
          >
            <Text
              className={
                esRiel
                  ? `text-sm ${activa ? 'font-semibold text-white' : 'text-gray-600'}`
                  : `text-center text-[14px] ${
                      activa
                        ? 'font-cuerpo-bold text-white'
                        : 'font-cuerpo-semi text-organic-neutral-700'
                    }`
              }
            >
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
