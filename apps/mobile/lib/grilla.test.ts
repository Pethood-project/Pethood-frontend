/**
 * Tests del relleno de la grilla de dos columnas.
 *
 *     cd apps/mobile && node --test --experimental-strip-types lib/grilla.test.ts
 *
 * Ver `listaChats.test.ts` para por qué se importa con ruta relativa y extensión.
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { conRellenoDeFila, RELLENO } from './grilla.ts';

describe('conRellenoDeFila', () => {
  it('completa la última fila cuando la cantidad es impar', () => {
    assert.deepEqual(conRellenoDeFila([1, 2, 3]), [1, 2, 3, RELLENO]);
  });

  it('no agrega nada cuando la cantidad es par', () => {
    assert.deepEqual(conRellenoDeFila([1, 2]), [1, 2]);
  });

  it('una lista vacía sigue vacía, para que se vea el estado vacío', () => {
    assert.deepEqual(conRellenoDeFila([]), []);
  });
});
