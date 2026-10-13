/**
 * Contraseña nueva: mínimo 8, con mayúscula, minúscula, número y símbolo. Espejo de
 * `pethood-backend/src/shared/validation/password.ts`; devuelve el error o `null`.
 *
 * Sólo para crearla o cambiarla. Al ingresar no se pide complejidad, para no dejar afuera
 * a las cuentas anteriores.
 */
const MINIMO_CARACTERES = 8;

const REGEX_MAYUSCULA = /[A-ZÁÉÍÓÚÜÑ]/;
const REGEX_MINUSCULA = /[a-záéíóúüñ]/;
const REGEX_NUMERO = /\d/;
const REGEX_SIMBOLO = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\d\s]/;

export function validarPasswordNueva(valor: string): string | null {
  if (valor === '') return 'La contraseña es obligatoria.';

  const cumple =
    valor.length >= MINIMO_CARACTERES &&
    REGEX_MAYUSCULA.test(valor) &&
    REGEX_MINUSCULA.test(valor) &&
    REGEX_NUMERO.test(valor) &&
    REGEX_SIMBOLO.test(valor);

  return cumple
    ? null
    : 'La contraseña debe tener al menos 8 caracteres, con una mayúscula, una minúscula, un número y un símbolo.';
}
