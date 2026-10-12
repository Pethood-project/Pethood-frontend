/**
 * La foto de perfil en el tamaño más grande disponible, para verla ampliada.
 *
 * Las cuentas creadas con Google guardan la URL que viene en su token, que pide la foto a 96px
 * (`…=s96-c`): alcanza para un avatar, pero a pantalla completa se ve pixelada. Google sirve la
 * misma foto en otro tamaño cambiando ese sufijo. Cualquier otra URL —las fotos que se suben a
 * PetHood— ya está guardada en su tamaño real y pasa sin tocar.
 */
export function fotoParaAmpliar(uri: string): string {
  if (!/googleusercontent\.com\//.test(uri)) return uri;
  return uri.replace(/=s\d+(-c)?$/, '=s1080');
}
