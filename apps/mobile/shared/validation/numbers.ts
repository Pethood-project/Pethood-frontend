/**
 * Validación numérica reutilizable. Funciones puras, sin dependencias.
 * Espejo de `pethood-backend/src/shared/validation/numbers.ts`.
 */

function patronDecimal(enteros: number, decimales: number): RegExp {
  // Sin decimales no hay parte decimal: `\d{1,0}` ni siquiera es una regex válida.
  const parteDecimal = decimales > 0 ? `([.,]\\d{1,${decimales}})?` : '';
  return new RegExp(`^\\d{1,${enteros}}${parteDecimal}$`);
}

/** Devuelve el mensaje de error, o null si el decimal es válido. */
export function validarDecimal(
  valor: string,
  opciones: { min: number; max: number; decimales: number; etiqueta: string },
): string | null {
  const { min, max, decimales, etiqueta } = opciones;
  const texto = valor.trim();

  if (!texto) return `${etiqueta} es obligatorio`;

  const enteros = String(Math.trunc(max)).length;

  if (!patronDecimal(enteros, decimales).test(texto)) {
    if (decimales === 0) return `${etiqueta} debe ser un número entero, sin puntos ni comas`;
    const ejemplo = ' (ej. 12,5)';
    return `${etiqueta} debe ser un número con hasta ${decimales} decimal${decimales === 1 ? '' : 'es'}${ejemplo}`;
  }

  const numero = Number(texto.replace(',', '.'));
  if (numero < min || numero > max) return `${etiqueta} debe estar entre ${min} y ${max}`;

  return null;
}

const MONTO_CON_MILES = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/;
const MONTO_SIMPLE = /^\d+([.,]\d{1,2})?$/;

/**
 * Pasa un monto en pesos tal como se escribe acá a un número con punto decimal, listo para
 * validar y mandar: «5.000» → «5000», «5.000,50» → «5000.50», «1500,5» → «1500.5».
 *
 * El punto seguido de grupos de tres dígitos es separador de miles: sin esto, «5.000» se leía
 * como cinco pesos. Lo que no encaja en ningún formato queda tal cual para que la validación
 * lo marque, en vez de adivinar.
 */
export function normalizarMonto(texto: string): string {
  const limpio = texto.trim();

  if (MONTO_CON_MILES.test(limpio)) return limpio.replace(/\./g, '').replace(',', '.');
  if (MONTO_SIMPLE.test(limpio)) return limpio.replace(',', '.');

  return limpio;
}

/**
 * Filtra lo que se puede tipear en un input decimal: dígitos y un único separador.
 * Se usa en `onChangeText` para que el teclado no deje escribir algo inválido.
 */
export function filtrarEntradaDecimal(texto: string, decimales: number): string {
  if (decimales === 0) return texto.replace(/\D/g, '');
  const limpio = texto.replace(/[^\d.,]/g, '');
  const separador = limpio.search(/[.,]/);

  if (separador === -1) return limpio;

  const parteEntera = limpio.slice(0, separador);
  const parteDecimal = limpio.slice(separador + 1).replace(/[.,]/g, '');

  return `${parteEntera}${limpio[separador]}${parteDecimal.slice(0, decimales)}`;
}
