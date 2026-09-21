/** Interruptor para un sí/no, con la etiqueta a la izquierda. */
import { Switch, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export type VarianteToggle =
  /** Etiqueta chica en mayúsculas, sin contorno: va dentro de una fila de `FormCard`. */
  | 'compacta'
  /** La etiqueta es la pregunta y la fila entera va en su propia caja (GUI-7.1.1 paso 2). */
  | 'caja';

interface ToggleFieldProps {
  label: string;
  valor: boolean;
  onChange: (valor: boolean) => void;
  variante?: VarianteToggle;
  /** Letra más grande, para el alta y la publicación de mascota. */
  grande?: boolean;
}

export function ToggleField({
  label,
  valor,
  onChange,
  variante = 'compacta',
  grande = false,
}: ToggleFieldProps) {
  const esCaja = variante === 'caja';

  return (
    <View
      className={
        esCaja
          ? 'flex-row items-center justify-between rounded-2xl border border-organic-neutral-300 bg-organic-surface py-2 pl-3.5 pr-2.5'
          : 'flex-row items-center justify-between'
      }
    >
      <Text
        className={
          esCaja
            ? `flex-1 font-cuerpo text-organic-neutral-800 ${grande ? 'text-[15px]' : 'text-[13.5px]'}`
            : `font-semibold uppercase tracking-wide text-gray-400 ${grande ? 'text-[13px]' : 'text-[11px]'}`
        }
      >
        {label}
      </Text>

      <Switch
        value={valor}
        onValueChange={onChange}
        accessibilityLabel={label}
        // La variante de caja es del rediseño Organic; la compacta sigue con el naranja
        // de marca del resto de los formularios, que todavía no se migraron.
        trackColor={{ false: PALETA.gris[200], true: esCaja ? PALETA.accent[600] : PALETA.pethood.naranja }}
        thumbColor={PALETA.blanco}
        ios_backgroundColor={PALETA.gris[200]}
        style={grande ? { transform: [{ scale: 1.15 }] } : undefined}
      />
    </View>
  );
}
