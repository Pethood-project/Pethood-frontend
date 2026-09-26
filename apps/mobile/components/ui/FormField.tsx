/**
 * Envoltorio común de los campos: etiqueta, marca de obligatorio y mensaje de error.
 * Centraliza el estilo para que todos los campos se vean igual.
 *
 * Los colores siguen a la paleta de la `FormCard` que lo envuelve (`usePaletaFormulario`):
 * grises de Tailwind en la clásica, rampa `neutral` en la `organic` (artboard 23).
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { PALETA } from '@/constants/theme';

import { usePaletaFormulario, type PaletaFormulario } from './FormCard';

/** Colores de etiqueta, lápiz, asterisco y pie según la paleta de la tarjeta. */
const COLORES: Record<
  PaletaFormulario,
  { etiqueta: string; asterisco: string; ayuda: string; lapiz: string }
> = {
  clasica: {
    etiqueta: 'font-semibold text-gray-400',
    asterisco: 'text-pethood-orange',
    ayuda: 'text-gray-400',
    lapiz: PALETA.gris[400],
  },
  organic: {
    etiqueta: 'font-cuerpo-semi text-organic-neutral-500',
    asterisco: 'text-organic-accent-600',
    ayuda: 'text-organic-neutral-500',
    lapiz: PALETA.neutral[500],
  },
};

export type VarianteCampo =
  /** Etiqueta chica en mayúsculas, sin caja: el borde lo pone la fila de `FormCard`. */
  | 'compacta'
  /**
   * La etiqueta es la pregunta y el campo va en su propia caja blanca. Es el formulario
   * de un solo campo por bloque, como el de solicitud (GUI-7.1.1).
   */
  | 'pregunta';

interface FormFieldProps {
  label: string;
  obligatorio?: boolean;
  error?: string;
  /** Texto de ayuda debajo del campo; el error tiene prioridad si hay uno. */
  ayuda?: string;
  /** Segunda ayuda, alineada a la derecha. Para el contador de caracteres. */
  ayudaDerecha?: string;
  variante?: VarianteCampo;
  /**
   * Solo mira la variante "pregunta". Los chips y los interruptores traen su propio
   * contorno, así que se dibujan sin la caja.
   */
  conCaja?: boolean;
  /**
   * Formularios de letra grande (alta y publicación de mascota, a pedido): agranda la
   * etiqueta y el pie del campo un escalón. El resto de las pantallas no la pasan y se ven
   * exactamente igual que antes.
   */
  grande?: boolean;
  /** Pinta un lapicito junto a la etiqueta, para marcar que el campo se puede editar (perfil). */
  lapiz?: boolean;
  children: ReactNode;
}

export function FormField({
  label,
  obligatorio,
  error,
  ayuda,
  ayudaDerecha,
  variante = 'compacta',
  conCaja = true,
  grande = false,
  lapiz = false,
  children,
}: FormFieldProps) {
  const esPregunta = variante === 'pregunta';
  const colores = COLORES[usePaletaFormulario()];

  return (
    // Sin flex acá: el reparto de ancho lo hace FormCardColumns. Con flex-1, los campos
    // de filas de un solo elemento intentan ocupar todo el alto y se aplastan entre sí.
    <View>
      <View className="mb-1 flex-row items-center gap-1.5">
        <Text
          className={
            esPregunta
              ? `font-cuerpo-semi text-organic-neutral-800 ${grande ? 'text-[15px]' : 'text-[13.5px]'}`
              : `${colores.etiqueta} uppercase tracking-wide ${grande ? 'text-[13px]' : 'text-[11px]'}`
          }
        >
          {label}
          {obligatorio ? <Text className={colores.asterisco}> *</Text> : null}
        </Text>
        {lapiz ? (
          <Ionicons name="pencil-outline" size={grande ? 14 : 12} color={colores.lapiz} />
        ) : null}
      </View>

      {esPregunta && conCaja ? (
        <View
          className={`rounded-2xl border bg-organic-surface px-3.5 py-3 ${
            error ? 'border-red-300' : 'border-organic-neutral-300'
          }`}
        >
          {children}
        </View>
      ) : (
        children
      )}

      <PieDeCampo
        error={error}
        ayuda={ayuda}
        ayudaDerecha={ayudaDerecha}
        grande={grande}
        claseAyuda={colores.ayuda}
      />
    </View>
  );
}

/**
 * Renglón de abajo. El error reemplaza a la ayuda izquierda pero no al contador: si el
 * texto se pasó de largo, ver cuánto se pasó es justamente lo que ayuda a corregirlo.
 */
function PieDeCampo({
  error,
  ayuda,
  ayudaDerecha,
  grande,
  claseAyuda,
}: Pick<FormFieldProps, 'error' | 'ayuda' | 'ayudaDerecha' | 'grande'> & { claseAyuda: string }) {
  if (!error && !ayuda && !ayudaDerecha) return null;

  const tamanio = grande ? 'text-sm' : 'text-xs';

  return (
    <View className="mt-1 flex-row items-start justify-between gap-3">
      <Text className={`flex-1 ${tamanio} ${error ? 'text-red-500' : claseAyuda}`}>
        {error ?? ayuda ?? ''}
      </Text>

      {ayudaDerecha ? <Text className={`${tamanio} ${claseAyuda}`}>{ayudaDerecha}</Text> : null}
    </View>
  );
}

/**
 * Estilo del texto de un campo dentro de la tarjeta: sin borde propio, lo da la fila. La
 * paleta sale de `usePaletaFormulario()` en el campo que la llama.
 */
export function claseValor(
  hayError: boolean,
  vacio: boolean,
  grande = false,
  paleta: PaletaFormulario = 'clasica',
): string {
  const organic = paleta === 'organic';
  const color = hayError
    ? 'text-red-500'
    : vacio
      ? organic
        ? 'text-organic-neutral-500'
        : 'text-gray-400'
      : organic
        ? 'text-organic-neutral-900'
        : 'text-gray-800';
  return `${grande ? 'text-lg' : 'text-base'} ${organic ? 'font-cuerpo ' : ''}${color}`;
}

/** Color del placeholder, que va por prop y no por clase. */
export function colorPlaceholder(paleta: PaletaFormulario): string {
  return paleta === 'organic' ? PALETA.neutral[500] : PALETA.gris[400];
}
