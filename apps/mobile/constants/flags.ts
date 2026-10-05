/**
 * Interruptores temporales de producto. El código del flujo se queda; apagar uno
 * saltea esa regla hasta que se vuelva a prender.
 *
 * `EXIGIR_VERIFICACION_PARA_SOLICITAR`: HU-7.1 pide cuenta verificada (DNI + selfie)
 * para solicitar. Encendida: sin verificar no se puede solicitar. Ojo: la pantalla de subida de
 * fotos (spec 002.1) todavía no existe, así que hoy la verifica el admin a mano.
 */
export const FLAGS = {
  EXIGIR_VERIFICACION_PARA_SOLICITAR: true,
};
