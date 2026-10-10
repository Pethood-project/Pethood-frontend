/**
 * Tests de los textos y cuentas de campañas.
 *
 *     cd apps/mobile && node --test --experimental-strip-types lib/campanias.test.ts
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  accionesDisponibles,
  formatearPesos,
  idsDeEstadosVigentes,
  motivoParaNoDonar,
  notaDonar,
  origenDeDonacion,
  textoDonantes,
  textoPendientes,
} from './campanias.ts';

describe('formatearPesos', () => {
  it('separa miles con punto y omite centavos en cero', () => {
    assert.equal(formatearPesos(1430000), '$1.430.000');
    assert.equal(formatearPesos(500), '$500');
  });

  it('muestra centavos con coma cuando los hay', () => {
    assert.equal(formatearPesos(5000.5), '$5.000,50');
  });
});

describe('textoDonantes', () => {
  it('singular y plural', () => {
    assert.equal(textoDonantes(1), '1 donante');
    assert.equal(textoDonantes(23), '23 donantes');
  });
});

describe('textoPendientes', () => {
  it('nada si no hay pendientes', () => {
    assert.equal(textoPendientes(0), null);
  });

  it('singular y plural en voseo', () => {
    assert.equal(textoPendientes(1), 'Tenés 1 donación para revisar');
    assert.equal(textoPendientes(3), 'Tenés 3 donaciones para revisar');
  });
});

describe('accionesDisponibles', () => {
  it('sigue la máquina de estados de la spec 026', () => {
    assert.deepEqual(accionesDisponibles('Activa'), ['finalizar', 'cancelar']);
    assert.deepEqual(accionesDisponibles('Inactiva'), ['cancelar']);
    assert.deepEqual(accionesDisponibles('Finalizada'), []);
    assert.deepEqual(accionesDisponibles('Cancelada'), []);
  });
});

describe('idsDeEstadosVigentes', () => {
  it('devuelve los ids de Inactiva y Activa, las que cuentan para el límite de 5', () => {
    const catalogo = [
      { id: 1, nombre: 'Inactiva' },
      { id: 2, nombre: 'Activa' },
      { id: 3, nombre: 'Finalizada' },
      { id: 4, nombre: 'Cancelada' },
    ];
    assert.deepEqual(idsDeEstadosVigentes(catalogo), [1, 2]);
  });

  it('sin catálogo no hay ids: la pantalla deja que decida el backend', () => {
    assert.deepEqual(idsDeEstadosVigentes([]), []);
  });
});

describe('motivoParaNoDonar', () => {
  const activa = { estado: { nombre: 'Activa' }, alias: 'patitas.castra.mp', cbu: null };

  it('null si está Activa y tiene alias o CBU', () => {
    assert.equal(motivoParaNoDonar(activa), null);
    assert.equal(
      motivoParaNoDonar({ ...activa, alias: null, cbu: '0000003100012345678901' }),
      null,
    );
  });

  it('avisa si ya no está Activa, antes de que alguien transfiera', () => {
    assert.equal(
      motivoParaNoDonar({ ...activa, estado: { nombre: 'Finalizada' } }),
      'Esta campaña ya no está recibiendo donaciones.',
    );
  });

  it('avisa si no tiene a dónde transferir', () => {
    assert.equal(
      motivoParaNoDonar({ ...activa, alias: null, cbu: null }),
      'Esta campaña todavía no cargó un alias ni un CBU para transferir.',
    );
  });
});

describe('notaDonar (spec 027)', () => {
  it('Mercado Pago con el refugio vinculado: se confirma sola', () => {
    assert.equal(notaDonar('MERCADO_PAGO', true), 'Se confirma sola en unos minutos.');
  });

  it('otro banco: la confirma el refugio, esté vinculado o no', () => {
    const texto = 'El refugio va a revisar que la transferencia haya llegado y la va a confirmar.';
    assert.equal(notaDonar('OTRO_BANCO', true), texto);
    assert.equal(notaDonar('OTRO_BANCO', false), texto);
  });

  it('Mercado Pago sin vincular, o sin elegir todavía: el texto de confirmación manual', () => {
    const manual =
      'Tu donación se suma a la campaña cuando el refugio confirme que recibió la transferencia.';
    assert.equal(notaDonar('MERCADO_PAGO', false), manual);
    assert.equal(notaDonar(null, true), manual);
  });
});

describe('origenDeDonacion (spec 027)', () => {
  it('Mercado Pago pendiente con el refugio vinculado: se confirma sola', () => {
    assert.deepEqual(origenDeDonacion('MERCADO_PAGO', true, true), {
      etiqueta: 'Desde Mercado Pago',
      ayuda: 'Se confirma sola',
    });
  });

  it('otro banco pendiente: hay que aplicarla a mano', () => {
    assert.deepEqual(origenDeDonacion('OTRO_BANCO', true, true), {
      etiqueta: 'Desde otro banco',
      ayuda: 'Revisá tu cuenta y aplicala a mano',
    });
  });

  it('Mercado Pago pendiente sin vincular: también a mano', () => {
    assert.deepEqual(origenDeDonacion('MERCADO_PAGO', true, false), {
      etiqueta: 'Desde Mercado Pago',
      ayuda: 'Revisá tu cuenta y aplicala a mano',
    });
  });

  it('ya revisada: sólo el origen; sin origen (donación vieja): nada', () => {
    assert.deepEqual(origenDeDonacion('OTRO_BANCO', false, true), {
      etiqueta: 'Desde otro banco',
      ayuda: null,
    });
    assert.equal(origenDeDonacion(null, true, true), null);
  });
});
