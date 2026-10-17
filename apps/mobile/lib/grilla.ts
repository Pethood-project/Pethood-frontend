/**
 * Grillas de dos columnas con `FlatList` (`numColumns={2}`): Favoritos y Mis mascotas.
 *
 * `FlatList` le da todo el ancho al único ítem de la última fila, así que se agrega un
 * relleno invisible para que esa tarjeta conserve su mitad.
 */
export const RELLENO = '__relleno__' as const;

export type ItemGrilla<T> = T | typeof RELLENO;

export function conRellenoDeFila<T>(items: T[]): ItemGrilla<T>[] {
  return items.length % 2 === 1 ? [...items, RELLENO] : items;
}
