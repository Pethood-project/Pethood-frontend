/**
 * DNI: 7 u 8 dígitos (spec 027). Espejo de `pethood-backend/src/shared/validation/documento.ts`.
 * Devuelve el error o `null`, que es lo que espera la prop `error` de los inputs.
 */
export function validarDni(valor: string): string | null {
  const dni = valor.trim();
  if (dni === '') return 'El DNI es obligatorio.';
  if (!/^\d{7,8}$/.test(dni)) return 'El DNI debe tener 7 u 8 dígitos numéricos.';
  return null;
}
