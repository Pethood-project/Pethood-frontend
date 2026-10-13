/**
 * Tests de la validación del DNI (espejo del backend, spec 027).
 *
 *     cd apps/mobile && node --test --experimental-strip-types shared/validation/documento.test.ts
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validarDni } from './documento.ts';

describe('validarDni', () => {
  it('vacío es obligatorio', () => {
    assert.equal(validarDni('  '), 'El DNI es obligatorio.');
  });

  it('7 u 8 dígitos, sin puntos ni letras', () => {
    assert.equal(validarDni('30.123.456'), 'El DNI debe tener 7 u 8 dígitos numéricos.');
    assert.equal(validarDni('123456'), 'El DNI debe tener 7 u 8 dígitos numéricos.');
  });

  it('válido: null', () => {
    assert.equal(validarDni('30123456'), null);
    assert.equal(validarDni(' 7123456 '), null);
  });
});
