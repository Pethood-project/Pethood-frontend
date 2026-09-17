/**
 * Validación numérica reutilizable. Funciones puras, sin dependencias.
 * Espejo de `pethood-backend/src/shared/validation/numbers.ts`.
 */

function patronDecimal(enteros: number, decimales: number): RegExp {
  return new RegExp(`^\\d{1,${enteros}}([.,]\\d{1,${decimales}})?$`);
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
    const ejemplo = decimales > 0 ? ' (ej. 12,5)' : '';
    return `${etiqueta} debe ser un número con hasta ${decimales} decimal${decimales === 1 ? '' : 'es'}${ejemplo}`;
  }

  const numero = Number(texto.replace(',', '.'));
  if (numero < min || numero > max) return `${etiqueta} debe estar entre ${min} y ${max}`;

  return null;
}

/**
 * Filtra lo que se puede tipear en un input decimal: dígitos y un único separador.
 * Se usa en `onChangeText` para que el teclado no deje escribir algo inválido.
 */
export function filtrarEntradaDecimal(texto: string, decimales: number): string {
  const limpio = texto.replace(/[^\d.,]/g, '');
  const separador = limpio.search(/[.,]/);

  if (separador === -1) return limpio;

  const parteEntera = limpio.slice(0, separador);
  const parteDecimal = limpio.slice(separador + 1).replace(/[.,]/g, '');

  return `${parteEntera}${limpio[separador]}${parteDecimal.slice(0, decimales)}`;
}
