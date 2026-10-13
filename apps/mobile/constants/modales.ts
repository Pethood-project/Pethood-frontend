/**
 * Valores del encadenado de modales. Viven acá y no en cada pantalla porque el problema es el
 * mismo en todas: si hay que ajustarlo, es un solo número.
 */
import { Platform } from 'react-native';

/**
 * Espera entre cerrar un `Modal` y abrir otro (una hoja de opciones que abre un diálogo, por
 * ejemplo). iOS no presenta un `Modal` mientras otro todavía se está yendo —el fade dura unos
 * 300 ms— y el segundo directamente no aparece. Android no tiene ese problema, así que ahí va
 * de una.
 */
export const ESPERA_ENTRE_MODALES_MS = Platform.OS === 'ios' ? 350 : 0;
