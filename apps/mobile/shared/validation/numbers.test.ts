/**
 * Tests de la validación numérica (espejo del backend).
 *
 *     cd apps/mobile && node --test --experimental-strip-types shared/validation/numbers.test.ts
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filtrarEntradaDecimal, normalizarMonto, validarDecimal } from './numbers.ts';

const META = { min: 10000, max: 2500000, decimales: 0, etiqueta: 'La meta' };

describe('validarDecimal sin decimales', () => {
  it('acepta un entero en rango', () => {
    assert.equal(validarDecimal('150000', META), null);
  });

  it('rechaza separador de miles o decimales con un mensaje claro, sin tirar', () => {
    assert.equal(
      validarDecimal('10.000', META),
      'La meta debe ser un número entero, sin puntos ni comas',
    );
  });
});

describe('filtrarEntradaDecimal sin decimales', () => {
  it('deja sólo dígitos', () => {
    assert.equal(filtrarEntradaDecimal('10.000,5', 0), '100005');
  });
});

describe('normalizarMonto (pesos como se escriben acá)', () => {
  it('toma el punto como separador de miles: «5.000» son cinco mil, no cinco', () => {
    assert.equal(normalizarMonto('5.000'), '5000');
    assert.equal(normalizarMonto('1.500.000'), '1500000');
  });

  it('miles con punto y centavos con coma', () => {
    assert.equal(normalizarMonto('5.000,50'), '5000.50');
  });

  it('coma o punto decimal sin miles quedan como decimal', () => {
    assert.equal(normalizarMonto('1500,5'), '1500.5');
    assert.equal(normalizarMonto('1500.50'), '1500.50');
  });

  it('un monto que no se entiende queda tal cual, para que lo marque la validación', () => {
    assert.equal(normalizarMonto('5.00.0'), '5.00.0');
  });
});
