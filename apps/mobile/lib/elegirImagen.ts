/**
 * Selector de imagen que funciona en nativo y en web.
 *
 * En web `Alert.alert` no hace nada (react-native-web lo implementa vacío) y el
 * `<input type="file">` de expo-image-picker solo se abre si se dispara en el mismo
 * gesto del click. Por eso en web se salta el menú Cámara/Galería y se abre el
 * selector de archivos directo.
 */
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { LIMITES } from '@/shared/validation/limits';
import { esMimeDeVideo } from './adjuntos';

import type { ArchivoImagenLocal } from './formDataImagen';

export const OPCIONES_IMAGEN_PERFIL: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: Platform.OS !== 'web',
  aspect: [1, 1],
  quality: 0.8,
};

function normalizarMime(tipo?: string | null): string {
  const minuscula = tipo?.toLowerCase().trim() ?? '';
  return minuscula === 'image/jpg' ? 'image/jpeg' : minuscula;
}

export function assetAArchivoLocal(asset: ImagePicker.ImagePickerAsset): ArchivoImagenLocal {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
    file: asset.file,
  };
}

/**
 * Mensaje de GUI-0.1.6 para un video, o `null` si sirve.
 *
 * **La duración se chequea SOLO acá.** El backend no puede medirla sin `ffmpeg`, así que
 * esta no es una validación "de UX" como las demás: es la única que existe. El peso sí lo
 * revalida el servidor.
 *
 * `duration` viene en milisegundos y puede ser `null` (la galería no siempre lo informa):
 * en ese caso no se bloquea, porque el tope de 5 MB ya acota indirectamente cuánto video
 * entra.
 */
export function validarAssetVideo(asset: ImagePicker.ImagePickerAsset): string | null {
  const tipo = normalizarMime(asset.mimeType);

  if (tipo && !(LIMITES.video.formatos as readonly string[]).includes(tipo)) {
    return 'Mandá un video en MP4, MOV o WEBM.';
  }

  if (asset.fileSize && asset.fileSize > LIMITES.video.tamanioMaximoBytes) {
    const megas = Math.round(LIMITES.video.tamanioMaximoBytes / (1024 * 1024));
    return `El video es muy pesado. Mandá uno que pese menos de ${megas} MB.`;
  }

  const segundos = asset.duration === null ? null : (asset.duration ?? 0) / 1000;

  if (segundos !== null && segundos > LIMITES.video.duracionMaximaSegundos) {
    return `El video es muy largo. Mandá uno de hasta ${LIMITES.video.duracionMaximaSegundos} segundos.`;
  }

  return null;
}

/** Valida el asset con la regla que corresponda según sea foto o video. */
export function validarAssetAdjunto(asset: ImagePicker.ImagePickerAsset): string | null {
  return esMimeDeVideo(asset.mimeType)
    ? validarAssetVideo(asset)
    : validarAssetImagen(asset);
}

/** Mensaje de GUI-0.1.6 o formato inválido; `null` si el archivo sirve. */
export function validarAssetImagen(asset: ImagePicker.ImagePickerAsset): string | null {
  const tipo = normalizarMime(asset.mimeType);

  if (tipo && !(LIMITES.imagen.formatos as readonly string[]).includes(tipo)) {
    return 'Subí una imagen en JPG, PNG o WEBP.';
  }

  if (asset.fileSize && asset.fileSize > LIMITES.imagen.tamanioMaximoBytes) {
    return 'La foto es muy pesada. Subí una imagen en JPG o PNG que pese menos de 5 MB.';
  }

  return null;
}

interface AbrirSelectorImagenParams {
  titulo: string;
  mensaje: string;
  opciones?: ImagePicker.ImagePickerOptions;
  onElegida: (asset: ImagePicker.ImagePickerAsset) => void;
  onQuitar?: () => void;
  onErrorPermisoGaleria: (mensaje: string) => void;
  onErrorPermisoCamara: (mensaje: string) => void;
}

/**
 * En web no usamos expo-image-picker: arma un `<input>` y llama `.click()`, que sí
 * cuenta como gesto del usuario. `dispatchEvent(new MouseEvent('click'))` (lo que hace
 * Expo) en Chrome no abre el selector.
 */
export function elegirArchivosWeb(
  multiple = false,
  accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
): Promise<ImagePicker.ImagePickerAsset[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';

    const terminar = (assets: ImagePicker.ImagePickerAsset[]): void => {
      input.remove();
      resolve(assets);
    };

    input.addEventListener('change', () => {
      const files = input.files ? Array.from(input.files) : [];
      terminar(
        files.map((file) => ({
          uri: URL.createObjectURL(file),
          width: 0,
          height: 0,
          mimeType: file.type,
          fileName: file.name,
          fileSize: file.size,
          // El `<input type="file">` no informa la duración de un video. `null` significa
          // "no se sabe" y `validarAssetVideo` no bloquea por eso: el tope de 5 MB alcanza.
          duration: null,
          file,
        })),
      );
    });
    input.addEventListener('cancel', () => terminar([]));

    document.body.appendChild(input);
    input.click();
  });
}

/** Qué devolvió el selector: fotos, o que el permiso no está. */
export type ResultadoSeleccion =
  | { assets: ImagePicker.ImagePickerAsset[] }
  | { permisoDenegado: 'camara' | 'galeria' };

/**
 * Varias fotos de la galería de una vez, hasta `maximo`.
 *
 * No pregunta de dónde: quien llama ya lo decidió con su propia hoja (`HojaAdjuntos`), en
 * vez del diálogo del sistema. En web no hay galería como tal: se abre el selector de
 * archivos, que también admite varios.
 */
export async function elegirFotosDeGaleria(maximo: number): Promise<ResultadoSeleccion> {
  if (Platform.OS === 'web') {
    const assets = await elegirArchivosWeb(true);
    return { assets: assets.slice(0, maximo) };
  }

  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return { permisoDenegado: 'galeria' };

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: maximo,
  });

  return { assets: resultado.canceled ? [] : resultado.assets.slice(0, maximo) };
}

/** Lo que el `<input>` de web acepta para un adjunto de chat: imagen o video. */
const ACCEPT_ADJUNTO_WEB = [
  'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm',
].join(',');

/**
 * Adjuntos de la galería para un mensaje de chat: fotos **o** un video.
 *
 * El selector ofrece las dos cosas porque el artboard 38 dice "Foto o video". Que el mensaje
 * no pueda mezclarlas, ni llevar más de un video, lo decide quien llama: acá sólo se elige.
 */
export async function elegirAdjuntosDeGaleria(maximo: number): Promise<ResultadoSeleccion> {
  if (Platform.OS === 'web') {
    const assets = await elegirArchivosWeb(true, ACCEPT_ADJUNTO_WEB);
    return { assets: assets.slice(0, maximo) };
  }

  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return { permisoDenegado: 'galeria' };

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: maximo,
  });

  return { assets: resultado.canceled ? [] : resultado.assets.slice(0, maximo) };
}

/**
 * Grabar un video con la cámara. Se graba de a uno.
 *
 * `videoMaxDuration` corta la grabación en el tope: es la única forma de impedir el video
 * largo **antes** de que exista, en vez de rechazarlo después. Al elegir de la galería no hay
 * equivalente y hay que validar después, con `validarAssetVideo`.
 */
export async function grabarVideoConCamara(): Promise<ResultadoSeleccion> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) return { permisoDenegado: 'camara' };

  const resultado = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: LIMITES.video.duracionMaximaSegundos,
    quality: 0.8,
  });

  return { assets: resultado.canceled ? [] : resultado.assets };
}

/** Una foto con la cámara. Se saca de a una, así que el máximo no aplica. */
export async function sacarFotoConCamara(): Promise<ResultadoSeleccion> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) return { permisoDenegado: 'camara' };

  const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });

  return { assets: resultado.canceled ? [] : resultado.assets };
}

export function abrirSelectorImagen(params: AbrirSelectorImagenParams): void {
  const opciones = params.opciones ?? OPCIONES_IMAGEN_PERFIL;

  if (Platform.OS === 'web') {
    void elegirArchivosWeb(false).then((assets) => {
      if (assets[0]) params.onElegida(assets[0]);
    });
    return;
  }

  Alert.alert(params.titulo, params.mensaje, [
    { text: 'Cámara', onPress: () => void tomarFoto(params, opciones) },
    { text: 'Galería', onPress: () => void elegirDeGaleria(params, opciones) },
    ...(params.onQuitar
      ? [{ text: 'Quitar foto', style: 'destructive' as const, onPress: params.onQuitar }]
      : []),
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

async function elegirDeGaleria(
  params: AbrirSelectorImagenParams,
  opciones: ImagePicker.ImagePickerOptions,
): Promise<void> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    params.onErrorPermisoGaleria('Necesitamos permiso para acceder a tus fotos.');
    return;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync(opciones);
  if (!resultado.canceled && resultado.assets[0]) {
    params.onElegida(resultado.assets[0]);
  }
}

async function tomarFoto(
  params: AbrirSelectorImagenParams,
  opciones: ImagePicker.ImagePickerOptions,
): Promise<void> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    params.onErrorPermisoCamara('Necesitamos permiso para usar la cámara.');
    return;
  }

  const resultado = await ImagePicker.launchCameraAsync(opciones);
  if (!resultado.canceled && resultado.assets[0]) {
    params.onElegida(resultado.assets[0]);
  }
}
