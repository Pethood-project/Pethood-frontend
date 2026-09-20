/**
 * Contador circular de pendientes — en GUI-08/GUI-31 son los mensajes sin leer, pegado
 * arriba a la derecha del avatar.
 *
 * No se confunde con `EstadoMascotaBadge`, que es una píldora de texto con el estado de una
 * mascota: esto es un número sobre un círculo, superpuesto a otro elemento.
 *
 * Con 0 no se renderiza: el diseño muestra el badge sólo en las filas con mensajes nuevos.
 *
 * Medidas del artboard 07 (sobre 262px, con el factor ×1,33 de HU-5.1): 17px de lado, texto
 * de 9px en negrita, anillo de 2px en `accent-100` y desplazado -2px hacia arriba y a la
 * derecha del avatar.
 */
import { Text, View } from 'react-native';

/**
 * A partir de acá el número se corta con "+". Tres dígitos estiran el círculo hasta taparle
 * el borde al avatar, y el dato exacto no le cambia nada al usuario.
 */
const TOPE = 99;

interface BadgeContadorProps {
  cantidad: number;
  /**
   * Color del anillo que separa el badge del avatar. El diseño lo da en `accent-100`, que
   * no es el fondo de la pantalla: es un halo claro alrededor del número.
   */
  claseAnillo?: string;
  accessibilityLabel?: string;
}

export function BadgeContador({
  cantidad,
  claseAnillo = 'border-organic-accent-100',
  accessibilityLabel,
}: BadgeContadorProps) {
  if (cantidad <= 0) return null;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      // `min-w` con `px-1`: hasta 9 es un círculo perfecto y de ahí en más crece a
      // píldora sin desbordar. El borde de 2px es el anillo del diseño.
      className={`absolute -right-[3px] -top-[3px] h-[23px] min-w-[23px] items-center justify-center rounded-full border-2 bg-organic-accent-600 px-1 ${claseAnillo}`}
    >
      <Text className="font-cuerpo-bold text-[12px] leading-none text-white">
        {cantidad > TOPE ? `${TOPE}+` : cantidad}
      </Text>
    </View>
  );
}
