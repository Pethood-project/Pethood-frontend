/**
 * Tests de la validación de contraseña nueva (espejo del backend).
 *
 *     cd apps/mobile && node --test --experimental-strip-types shared/validation/password.test.ts
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validarPasswordNueva } from './password.ts';

const MENSAJE =
  'La contraseña debe tener al menos 8 caracteres, con una mayúscula, una minúscula, un número y un símbolo.';

describe('validarPasswordNueva', () => {
  it('vacío es obligatoria', () => {
    assert.equal(validarPasswordNueva(''), 'La contraseña es obligatoria.');
  });

  it('rechaza lo que no junta las cuatro clases y el largo', () => {
    assert.equal(validarPasswordNueva('Ab1!abc'), MENSAJE);
    assert.equal(validarPasswordNueva('secreta123!'), MENSAJE);
    assert.equal(validarPasswordNueva('SECRETA123!'), MENSAJE);
    assert.equal(validarPasswordNueva('Secretaaa!!'), MENSAJE);
    assert.equal(validarPasswordNueva('Secreta1234'), MENSAJE);
  });

  it('el espacio no cuenta como símbolo', () => {
    assert.equal(validarPasswordNueva('Secreta 123'), MENSAJE);
  });

  it('válida: null', () => {
    assert.equal(validarPasswordNueva('Secreta123!'), null);
    assert.equal(validarPasswordNueva('Ñandú2024#'), null);
  });
});
