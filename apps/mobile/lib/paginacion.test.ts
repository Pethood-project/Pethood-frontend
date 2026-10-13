/**
 * Tests de las cuentas de la paginación por cursor.
 *
 *     cd apps/mobile && node --test --experimental-strip-types lib/paginacion.test.ts
 *
 * Ver `listaChats.test.ts` para por qué se importa con ruta relativa y extensión.
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { agregarAlPrincipio, reemplazar, unirPagina } from './paginacion.ts';

interface Item {
  id: number;
  texto: string;
}

const item = (id: number, texto = `aviso ${id}`): Item => ({ id, texto });
const porId = (actual: Item): number => actual.id;

describe('unirPagina', () => {
  it('suma la página nueva al final, en su orden', () => {
    assert.deepEqual(
      unirPagina([item(9), item(8)], [item(7), item(6)], porId).map(porId),
      [9, 8, 7, 6],
    );
  });

  it('no repite un ítem que ya estaba y se queda con la versión que ya se veía', () => {
    const unida = unirPagina(
      [item(9, 'recién creado'), item(8)],
      [item(9, 'del servidor'), item(7)],
      porId,
    );

    assert.deepEqual(unida.map(porId), [9, 8, 7]);
    assert.equal(unida[0]!.texto, 'recién creado');
  });

  it('con la página vacía deja todo como estaba', () => {
    assert.deepEqual(unirPagina([item(1)], [], porId).map(porId), [1]);
  });
});

describe('agregarAlPrincipio', () => {
  it('pone el ítem nuevo arriba de todo', () => {
    assert.deepEqual(agregarAlPrincipio([item(2), item(1)], item(3), porId).map(porId), [3, 2, 1]);
  });

  it('si ya estaba lo mueve arriba sin duplicarlo', () => {
    assert.deepEqual(
      agregarAlPrincipio([item(2), item(3), item(1)], item(3), porId).map(porId),
      [3, 2, 1],
    );
  });
});

describe('reemplazar', () => {
  it('actualiza el ítem sin moverlo de lugar', () => {
    const lista = reemplazar([item(3), item(2), item(1)], item(2, 'resuelto'), porId);

    assert.deepEqual(lista.map(porId), [3, 2, 1]);
    assert.equal(lista[1]!.texto, 'resuelto');
  });

  it('con la clave ausente deja la lista intacta', () => {
    // El ítem no es de esta página: recargar el listado por eso sería peor que no mostrar
    // el cambio (HU-13.2, al resolver un aviso que quedó fuera de la página cargada).
    const original = [item(3), item(1)];
    const lista = reemplazar(original, item(2, 'resuelto'), porId);

    assert.deepEqual(lista.map(porId), [3, 1]);
    assert.deepEqual(lista.map((actual) => actual.texto), original.map((actual) => actual.texto));
  });

  it('a diferencia de agregarAlPrincipio, no lo sube', () => {
    const subido = agregarAlPrincipio([item(3), item(2), item(1)], item(1, 'nuevo'), porId);
    const enSuLugar = reemplazar([item(3), item(2), item(1)], item(1, 'nuevo'), porId);

    assert.deepEqual(subido.map(porId), [1, 3, 2]);
    assert.deepEqual(enSuLugar.map(porId), [3, 2, 1]);
  });
});
