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
export function elegirArchivosWeb(multiple = false): Promise<ImagePicker.ImagePickerAsset[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
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
          file,
        })),
      );
    });
    input.addEventListener('cancel', () => terminar([]));

    document.body.appendChild(input);
    input.click();
  });
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
