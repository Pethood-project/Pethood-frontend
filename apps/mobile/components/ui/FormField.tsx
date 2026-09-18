/**
 * Envoltorio común de los campos: etiqueta, marca de obligatorio y mensaje de error.
 * Centraliza el estilo para que todos los campos se vean igual.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { PALETA } from '@/constants/theme';

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

  return (
    // Sin flex acá: el reparto de ancho lo hace FormCardColumns. Con flex-1, los campos
    // de filas de un solo elemento intentan ocupar todo el alto y se aplastan entre sí.
    <View>
      <View className="mb-1 flex-row items-center gap-1.5">
        <Text
          className={
            esPregunta
              ? `font-cuerpo-semi text-organic-neutral-800 ${grande ? 'text-[15px]' : 'text-[13.5px]'}`
              : `font-semibold uppercase tracking-wide text-gray-400 ${grande ? 'text-[13px]' : 'text-[11px]'}`
          }
        >
          {label}
          {obligatorio ? <Text className="text-pethood-orange"> *</Text> : null}
        </Text>
        {lapiz ? (
          <Ionicons name="pencil-outline" size={grande ? 14 : 12} color={PALETA.gris[400]} />
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

      <PieDeCampo error={error} ayuda={ayuda} ayudaDerecha={ayudaDerecha} grande={grande} />
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
}: Pick<FormFieldProps, 'error' | 'ayuda' | 'ayudaDerecha' | 'grande'>) {
  if (!error && !ayuda && !ayudaDerecha) return null;

  const tamanio = grande ? 'text-sm' : 'text-xs';

  return (
    <View className="mt-1 flex-row items-start justify-between gap-3">
      <Text className={`flex-1 ${tamanio} ${error ? 'text-red-500' : 'text-gray-400'}`}>
        {error ?? ayuda ?? ''}
      </Text>

      {ayudaDerecha ? <Text className={`${tamanio} text-gray-400`}>{ayudaDerecha}</Text> : null}
    </View>
  );
}

/** Estilo del texto de un campo dentro de la tarjeta: sin borde propio, lo da la fila. */
export function claseValor(hayError: boolean, vacio: boolean, grande = false): string {
  const color = hayError ? 'text-red-500' : vacio ? 'text-gray-400' : 'text-gray-800';
  return `${grande ? 'text-lg' : 'text-base'} ${color}`;
}
