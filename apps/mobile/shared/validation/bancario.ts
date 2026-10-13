/**
 * Alias y CBU/CVU para transferir (spec 026). Espejo de
 * `pethood-backend/src/shared/validation/bancario.ts`. Devuelven el error o `null`; vacío es
 * válido porque cada uno es opcional por separado (la pantalla exige al menos uno).
 */
import { LIMITES } from './limits';

export function validarAlias(valor: string): string | null {
  const alias = valor.trim();
  const { min, max } = LIMITES.campania.alias;

  if (alias === '') return null;
  if (alias.length < min || alias.length > max) {
    return `El alias debe tener entre ${min} y ${max} caracteres`;
  }
  if (!/^[A-Za-z0-9.-]+$/.test(alias)) {
    return 'El alias sólo puede tener letras, números, puntos y guiones';
  }

  return null;
}

export function validarCbu(valor: string): string | null {
  const cbu = valor.replace(/\s+/g, '');
  const { largo } = LIMITES.campania.cbu;

  if (cbu === '') return null;
  if (cbu.length !== largo || !/^\d+$/.test(cbu)) return `El CBU o CVU debe tener ${largo} números`;

  return null;
}
