import { Platform } from 'react-native';

export interface ArchivoImagenLocal {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  /** En web, expo-image-picker entrega el File original para armar el FormData. */
  file?: File;
}

function extensionDeMime(mimeType?: string | null): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function normalizarMime(mimeType?: string | null): string {
  const tipo = mimeType?.toLowerCase().trim();
  if (tipo === 'image/jpg') return 'image/jpeg';
  if (tipo === 'image/png' || tipo === 'image/webp' || tipo === 'image/jpeg') return tipo;
  return 'image/jpeg';
}

export async function appendArchivoImagen(
  form: FormData,
  campo: string,
  imagen: ArchivoImagenLocal,
): Promise<void> {
  const mimeType = normalizarMime(imagen.mimeType ?? imagen.file?.type);
  const nombre = imagen.fileName ?? imagen.file?.name ?? `perfil.${extensionDeMime(mimeType)}`;

  if (Platform.OS === 'web') {
    const origen = imagen.file ?? (await (await fetch(imagen.uri)).blob());
    form.append(campo, new File([origen], nombre, { type: mimeType }), nombre);
    return;
  }

  form.append(
    campo,
    {
      uri: imagen.uri,
      name: nombre,
      type: mimeType,
    } as unknown as Blob,
  );
}
