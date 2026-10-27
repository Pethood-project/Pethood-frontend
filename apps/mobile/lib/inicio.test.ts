/**
 * Tests de los textos y cálculos de la pantalla de Inicio.
 *
 *     cd apps/mobile && node --test --experimental-strip-types lib/inicio.test.ts
 *
 * Ver `listaChats.test.ts` para por qué se importa con ruta relativa y extensión.
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SolicitudEnSeguimiento } from '../services/seguimiento';
import {
  conPlural,
  dentroDeFrase,
  hojaDeAlmanaque,
  pasoDeSolicitud,
  seguimientoDestacado,
  tituloAdoptar,
} from './inicio.ts';

function seguimiento(parcial: Partial<SolicitudEnSeguimiento>): SolicitudEnSeguimiento {
  return {
    solicitudId: 1,
    tipo: 'Adopcion',
    rol: 'ADOPTANTE',
    mascota: { id: 1, nombre: 'Coco', imagenUrl: null },
    adoptante: { id: 1, nombre: 'Juan', apellido: 'Pérez' },
    totales: { completados: 0, vencidos: 0, pendientes: 0 },
    pendiente: null,
    proximoAviso: null,
    finalizado: false,
    ...parcial,
  };
}

describe('textos de Inicio', () => {
  it('pluraliza', () => {
    assert.equal(conPlural(1, 'activa', 'activas'), '1 activa');
    assert.equal(conPlural(0, 'activa', 'activas'), '0 activas');
    assert.equal(conPlural(24, 'activa', 'activas'), '24 activas');
  });

  it('arma el título de Adoptar según cuántas mascotas hay', () => {
    assert.equal(tituloAdoptar(0), 'Todavía no hay peludos para adoptar');
    assert.equal(tituloAdoptar(1), '1 peludo busca familia');
    assert.equal(tituloAdoptar(12), '12 peludos buscan familia');
  });

  it('mete el tiempo relativo en una frase', () => {
    assert.equal(dentroDeFrase('Ahora'), 'recién');
    assert.equal(dentroDeFrase('Ayer'), 'ayer');
    assert.equal(dentroDeFrase('5 min'), 'hace 5 min');
  });

  it('arma la hoja de almanaque en hora local', () => {
    assert.deepEqual(hojaDeAlmanaque(new Date(2026, 7, 15, 10).toISOString()), {
      mes: 'AGO',
      dia: '15',
    });
    assert.equal(hojaDeAlmanaque('no es fecha'), null);
  });

  it('pinta los tramos de la solicitud', () => {
    assert.equal(pasoDeSolicitud('Pendiente'), 1);
    assert.equal(pasoDeSolicitud('En_Revision'), 2);
    assert.equal(pasoDeSolicitud('Revisada'), 3);
    assert.equal(pasoDeSolicitud('Aprobada'), 4);
    assert.equal(pasoDeSolicitud('Rechazada'), 0);
    assert.equal(pasoDeSolicitud('Cerrada'), 0);
  });
});

describe('seguimientoDestacado', () => {
  it('prioriza el pedido que espera foto, el de plazo más corto', () => {
    const elegido = seguimientoDestacado([
      seguimiento({ solicitudId: 1, proximoAviso: '2026-10-01T00:00:00Z' }),
      seguimiento({
        solicitudId: 2,
        pendiente: { id: 9, pregunta: '¿Cómo está?', plazo: '2026-10-05T00:00:00Z' },
      }),
      seguimiento({
        solicitudId: 3,
        pendiente: { id: 8, pregunta: '¿Cómo está?', plazo: '2026-10-03T00:00:00Z' },
      }),
    ]);

    assert.equal(elegido?.solicitudId, 3);
  });

  it('sin pedidos, el próximo aviso más cercano', () => {
    const elegido = seguimientoDestacado([
      seguimiento({ solicitudId: 1, proximoAviso: '2026-10-09T00:00:00Z' }),
      seguimiento({ solicitudId: 2, proximoAviso: '2026-10-02T00:00:00Z' }),
    ]);

    assert.equal(elegido?.solicitudId, 2);
  });

  it('ignora los finalizados y los que entregó el usuario', () => {
    assert.equal(
      seguimientoDestacado([
        seguimiento({ finalizado: true }),
        seguimiento({ rol: 'PUBLICADOR', proximoAviso: '2026-10-02T00:00:00Z' }),
      ]),
      null,
    );
  });
});
