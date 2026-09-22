/**
 * Tests del filtro de conversaciones por nombre de contacto (HU-5.3).
 *
 * Corren con el runner que trae Node, sin sumar una sola dependencia al proyecto:
 *
 *     cd apps/mobile && node --test --experimental-strip-types lib/listaChats.test.ts
 *
 * (desde Node 22.18 el flag ya no hace falta: el borrado de tipos viene activado).
 *
 * Por eso se importa `./listaChats.ts` con ruta relativa y extensión, y no por el alias
 * `@/`: el alias lo resuelve Metro, no Node. `listaChats.ts` sólo importa tipos del resto
 * de la app —que el borrado de tipos hace desaparecer— y el módulo real `./texto.ts`, así
 * que la cadena se puede cargar sin bundler ni React Native de por medio.
 */
/// <reference types="node" />
// La referencia de arriba es sólo para este archivo: TypeScript 6 ya no incluye los
// paquetes de `@types` automáticamente, así que sin ella no conoce `node:test`. Se deja
// acá y no en `tsconfig.json` para que los tipos de Node no entren en el resto de la app,
// donde `setTimeout` y compañía son los de React Native y no los de Node.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filtrarPorContacto } from './listaChats.ts';
import type { Conversacion } from '../services/chats.ts';

/**
 * Conversación mínima: de todo el DTO, el filtro sólo mira `contacto.nombre`. El resto va
 * con valores válidos para no mentirle al tipo.
 */
function conversacion(chatId: number, nombre: string): Conversacion {
  return {
    chatId,
    contacto: { tipo: 'USUARIO', id: chatId, nombre, imagenUrl: null, activo: true },
    ultimoMensaje: null,
    noLeidos: 0,
    fechaUltimaActividad: '2026-09-01T14:05:00.000Z',
  };
}

/** Orden de entrada = el del servidor, por `fechaUltimaActividad` descendente. */
const CHATS: Conversacion[] = [
  conversacion(1, 'Refugio Patitas'),
  conversacion(2, 'Ana Pérez'),
  conversacion(3, 'María Gómez'),
  conversacion(4, 'Huellitas del Sur'),
  conversacion(5, 'Maria Lopez'),
  conversacion(6, 'Refugio Muñeca'),
];

/** Los nombres que sobreviven al filtro, para comparar de un vistazo. */
function nombres(chats: Conversacion[]): string[] {
  return chats.map((chat) => chat.contacto.nombre);
}

test('coincidencia parcial en cualquier parte del nombre', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'pat')), ['Refugio Patitas']);
  // No ancla al principio: "sur" está al final de "Huellitas del Sur".
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'sur')), ['Huellitas del Sur']);
});

test('coincidencia total', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'Refugio Patitas')), ['Refugio Patitas']);
});

test('insensible a mayúsculas y minúsculas', () => {
  const esperado = ['Refugio Patitas', 'Refugio Muñeca'];
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'REFUGIO')), esperado);
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'refugio')), esperado);
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'ReFuGiO')), esperado);
});

test('insensible a tildes en los dos sentidos', () => {
  // Sin tilde encuentra al que la tiene, y encuentra a los dos "maria".
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'maria')), ['María Gómez', 'Maria Lopez']);
  // Con tilde encuentra también al que está cargado sin ella.
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'maría')), ['María Gómez', 'Maria Lopez']);
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'perez')), ['Ana Pérez']);
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'Pérez')), ['Ana Pérez']);
});

test('la ñ se pliega a n, decisión tomada para el buscador', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'muneca')), ['Refugio Muñeca']);
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'muñeca')), ['Refugio Muñeca']);
});

test('ignora los espacios del principio y del final', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, '   pat  ')), ['Refugio Patitas']);
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, '\tpat\n')), ['Refugio Patitas']);
});

test('los espacios internos sí cuentan', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'refugio pat')), ['Refugio Patitas']);
  // Dos espacios donde el nombre tiene uno: no coincide, y está bien que no coincida.
  assert.deepEqual(filtrarPorContacto(CHATS, 'refugio  pat'), []);
});

test('término vacío devuelve la lista entera, sin tocar el orden', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, '')), nombres(CHATS));
});

test('un término de puros espacios equivale a búsqueda vacía', () => {
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, '   ')), nombres(CHATS));
});

test('sin coincidencias devuelve una lista vacía', () => {
  assert.deepEqual(filtrarPorContacto(CHATS, 'zzz'), []);
  // Un carácter que ningún nombre tiene no rompe nada: simplemente no coincide. Es lo que
  // hace innecesario validar el juego de caracteres del término.
  assert.deepEqual(filtrarPorContacto(CHATS, '@#$'), []);
});

test('conserva el orden original entre los resultados', () => {
  // "Refugio Muñeca" está último en la entrada y tiene que seguir último en la salida.
  assert.deepEqual(nombres(filtrarPorContacto(CHATS, 'refugio')), [
    'Refugio Patitas',
    'Refugio Muñeca',
  ]);
});

test('es una vista: no modifica la lista que recibe', () => {
  const antes = nombres(CHATS);
  filtrarPorContacto(CHATS, 'pat');
  assert.deepEqual(nombres(CHATS), antes);
  // Y devuelve las mismas referencias, no copias: la fila no se re-renderiza de más.
  assert.equal(filtrarPorContacto(CHATS, 'pat')[0], CHATS[0]);
});

test('una lista vacía devuelve una lista vacía, con y sin término', () => {
  assert.deepEqual(filtrarPorContacto([], 'pat'), []);
  assert.deepEqual(filtrarPorContacto([], ''), []);
});
