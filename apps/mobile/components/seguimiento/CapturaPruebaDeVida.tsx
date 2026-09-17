/**
 * Captura de la "prueba de vida" del seguimiento post-adopción (HU-9.1, GUI-22).
 *
 * A diferencia de `PhotoPicker`, acá NO se ofrece la galería: la foto tiene que salir de la
 * cámara en el momento. Es un requisito no negociable del proyecto (regla transversal 9) y
 * la única garantía real es esta — el backend recibe un archivo y no puede saber si se sacó
 * ahora o si estaba guardada en el teléfono desde hace un año.
 *
 * Por lo mismo la pantalla se bloquea en web: `launchCameraAsync` ahí cae en el selector de
 * archivos del navegador (los docs de Expo aclaran que el permiso de cámara "does nothing on
 * web"), que es exactamente la galería que hay que impedir. Preferimos no dejar subir a
 * dejar subir mal.
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { PALETA } from '@/constants/theme';
import { validarAssetImagen } from '@/lib/elegirImagen';

/** Mismo contrato que espera `subirActualizacion` en `services/seguimiento.ts`. */
export interface FotoCapturada {
  uri: string;
  nombre: string;
  tipo: string;
}

interface CapturaPruebaDeVidaProps {
  foto: FotoCapturada | null;
  onChange: (foto: FotoCapturada | null) => void;
  /** Error de validación del formulario, ej. "Adjuntar imagen de prueba". */
  error?: string;
  deshabilitado?: boolean;
}

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Algunos Android devuelven 'image/jpg', que no es un MIME type real. */
function normalizarTipo(tipo: string | null | undefined): string {
  const minuscula = tipo?.toLowerCase().trim() ?? '';
  return minuscula === 'image/jpg' || minuscula === '' ? 'image/jpeg' : minuscula;
}

export const CAMARA_NO_DISPONIBLE_EN_WEB =
  'La foto de prueba tiene que sacarse con la cámara en el momento. Abrí PetHood en tu teléfono para completar el seguimiento.';

export function CapturaPruebaDeVida({
  foto,
  onChange,
  error,
  deshabilitado = false,
}: CapturaPruebaDeVidaProps) {
  /** Aviso propio del componente (permisos, archivo rechazado), distinto del error del form. */
  const [aviso, setAviso] = useState<string | null>(null);
  const enWeb = Platform.OS === 'web';

  const capturar = async (): Promise<void> => {
    setAviso(null);

    if (enWeb) {
      setAviso(CAMARA_NO_DISPONIBLE_EN_WEB);
      return;
    }

    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      setAviso(
        permiso.canAskAgain
          ? 'Necesitamos la cámara para sacar la foto de prueba. Dale permiso a PetHood e intentalo de nuevo.'
          : 'Le negaste la cámara a PetHood. Habilitala desde los ajustes del teléfono para poder subir la actualización.',
      );
      return;
    }

    // `mediaTypes: ['images']` para que no aparezca el modo video; sin `allowsEditing`,
    // porque recortar abre una pantalla de edición que no aporta a una prueba de vida.
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets[0]) return;

    const asset = resultado.assets[0];
    const problema = validarAssetImagen(asset);

    if (problema) {
      setAviso(problema);
      return;
    }

    const tipo = normalizarTipo(asset.mimeType);
    onChange({
      uri: asset.uri,
      nombre: `seguimiento.${EXTENSION_POR_TIPO[tipo] ?? 'jpg'}`,
      tipo,
    });
  };

  const bloqueado = deshabilitado || enWeb;

  return (
    // La restricción se explica siempre que no haya nada más urgente que decir: que la
    // galería no esté es una decisión del producto, y sin ese renglón se lee como un bug.
    // El aviso propio (permiso denegado, archivo rechazado) pisa al error del formulario:
    // es lo que acaba de pasar y lo que hay que resolver primero.
    <FormField
      label="Foto de prueba"
      obligatorio
      error={aviso ?? error}
      ayuda="Tiene que ser una foto sacada en el momento con la cámara. No se puede elegir una de la galería."
    >
      {foto ? (
        <View className="relative">
          <Image
            source={{ uri: foto.uri }}
            className="h-52 w-full rounded-3xl"
            accessibilityLabel="Foto de prueba que acabás de sacar"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sacar la foto de nuevo"
            disabled={bloqueado}
            onPress={() => void capturar()}
            className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full bg-black/50 px-3 py-2 active:opacity-80"
          >
            <Ionicons name="camera-outline" size={16} color={PALETA.blanco} />
            <Text className="text-xs font-medium text-white">Sacar de nuevo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sacar la foto de prueba con la cámara"
          accessibilityState={{ disabled: bloqueado }}
          disabled={deshabilitado}
          onPress={() => void capturar()}
          className={`h-16 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed ${
            error ? 'border-red-300 bg-red-50' : 'border-pethood-beige-dark bg-white'
          } ${bloqueado ? 'opacity-60' : 'active:opacity-80'}`}
        >
          <Ionicons name="camera" size={18} color={PALETA.grisCalido[400]} />
          <Text className="text-sm font-medium text-gray-500">Sacar foto ahora</Text>
        </Pressable>
      )}
    </FormField>
  );
}
