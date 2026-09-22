/**
 * Normalización de texto para **comparar**, nunca para mostrar.
 *
 * Lo que devuelve esta función es una clave de comparación: no se renderiza, no se guarda
 * y no se manda al backend. El nombre del contacto se sigue pintando tal cual lo mandó el
 * servidor, con sus tildes y mayúsculas.
 *
 * Funciones puras, sin dependencias: se pueden testear con `node --test`.
 */

/**
 * Marcas diacríticas combinantes (bloque Unicode U+0300–U+036F).
 *
 * Se usa el rango explícito y no `\p{Diacritic}` porque la propiedad Unicode necesita el
 * flag `u` y no está garantizada en Hermes; el rango es el mismo resultado y funciona en
 * cualquier motor.
 */
const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

/**
 * Pasa un texto a su forma comparable: sin espacios en los extremos, sin tildes y en
 * minúsculas.
 *
 * `NFD` descompone cada letra acentuada en su letra base más la marca combinante, y el
 * `replace` se queda solo con la base: `"María"` → `"maria"`. Como la comparación aplica la
 * misma transformación a los dos lados, la búsqueda queda insensible a tildes **en ambos
 * sentidos**: `"maria"` encuentra `"María"` y `"maría"` encuentra `"Maria"`. El segundo caso
 * importa tanto como el primero, porque muchos nombres se cargan sin tilde.
 *
 * **La `ñ` también se pliega** (`"Muñeca"` → `"muneca"`): NFD la descompone igual que a una
 * vocal acentuada. Es una decisión tomada, no un descuido — en español la `ñ` es una letra
 * propia, pero para un buscador conviene perdonar al que no la tiene a mano en el teclado.
 * El costo es que una búsqueda puede traer un resultado de más, que en una lista de
 * conversaciones es inofensivo.
 *
 * Los espacios **internos** se respetan: solo se recortan los de los extremos. Un texto de
 * puros espacios queda en `''`, que es lo mismo que no haber buscado nada.
 */
export function normalizarParaBusqueda(texto: string): string {
  return texto.trim().normalize('NFD').replace(MARCAS_DIACRITICAS, '').toLowerCase();
}
