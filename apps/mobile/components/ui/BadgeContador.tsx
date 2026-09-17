/**
 * Contador circular de pendientes — en GUI-08/GUI-31 son los mensajes sin leer, pegado
 * arriba a la derecha del avatar.
 *
 * No se confunde con `EstadoMascotaBadge`, que es una píldora de texto con el estado de una
 * mascota: esto es un número sobre un círculo, superpuesto a otro elemento.
 *
 * Con 0 no se renderiza: el diseño muestra el badge sólo en las filas con mensajes nuevos.
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
   * Color del anillo que separa el badge del avatar. Tiene que ser el fondo sobre el que se
   * apoya el conjunto (en el diseño, el beige de la pantalla).
   */
  claseAnillo?: string;
  accessibilityLabel?: string;
}

export function BadgeContador({
  cantidad,
  claseAnillo = 'border-pethood-beige',
  accessibilityLabel,
}: BadgeContadorProps) {
  if (cantidad <= 0) return null;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      // `min-w-5` con `px-1`: hasta 9 es un círculo perfecto y de ahí en más crece a
      // píldora sin desbordar. El borde de 2px es el anillo del diseño.
      className={`absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 bg-pethood-orange px-1 ${claseAnillo}`}
    >
      <Text className="text-[11px] font-bold leading-none text-white">
        {cantidad > TOPE ? `${TOPE}+` : cantidad}
      </Text>
    </View>
  );
}
