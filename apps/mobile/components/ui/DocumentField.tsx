/**
 * Selección del comprobante médico de una historia clínica: imagen (cámara o galería) o
 * PDF. Valida formato y peso antes de aceptar el archivo (LIMITES.documento) y solo admite
 * uno a la vez — elegir uno nuevo reemplaza al anterior, igual que hace el backend al
 * guardar (HU-8.1 / HU-8.3).
 */
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { LIMITES } from '@/shared/validation/limits';
import { useState } from 'react';

import { EditorFotoModal } from './EditorFotoModal';

export interface DocumentoElegido {
  uri: string;
  nombre: string;
  tipo: string;
  /** Solo para mostrar la miniatura correcta; no viaja al backend. */
  esImagen: boolean;
}

interface DocumentFieldProps {
  documento: DocumentoElegido | null;
  onChange: (documento: DocumentoElegido | null) => void;
  /** URL absoluta de un documento ya guardado (edición), para mostrar antes de reemplazarlo. */
  urlExistente?: string | null;
  nombreExistente?: string | null;
  error?: string;
  /** Letra, ícono y caja más grandes, para el registro médico nuevo. */
  grande?: boolean;
}

const MENSAJE_INVALIDO = 'No es posible subir ese documento, revise el formato o tamaño';

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

function normalizarTipo(tipo: string): string {
  const minuscula = tipo.toLowerCase().trim();
  return minuscula === 'image/jpg' ? 'image/jpeg' : minuscula;
}

function tipoValido(tipo: string): boolean {
  return (LIMITES.documento.formatos as readonly string[]).includes(tipo);
}

function pesoValido(bytes: number | undefined): boolean {
  return bytes === undefined || bytes <= LIMITES.documento.tamanioMaximoBytes;
}

export function DocumentField({
  documento,
  onChange,
  urlExistente,
  nombreExistente,
  error,
  grande = false,
}: DocumentFieldProps) {
  const [cargando, setCargando] = useState(false);
  /** Imagen recién elegida, en revisión en el editor de recorte/rotación antes de confirmarse. */
  const [pendiente, setPendiente] = useState<{ uri: string; tipo: string } | null>(null);

  const abrirGaleria = async (): Promise<void> => {
    setCargando(true);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (resultado.canceled || !resultado.assets[0]) return;

      const asset = resultado.assets[0];
      const tipo = normalizarTipo(asset.mimeType ?? 'image/jpeg');

      if (!tipoValido(tipo) || !pesoValido(asset.fileSize)) {
        Alert.alert('Documento inválido', MENSAJE_INVALIDO);
        return;
      }

      // No se confirma todavía: primero pasa por el editor, donde se puede recortar y girar.
      setPendiente({ uri: asset.uri, tipo });
    } finally {
      setCargando(false);
    }
  };

  const abrirCamara = async (): Promise<void> => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        'Necesitamos la cámara',
        'Dale permiso a PetHood para usar la cámara, o elegí un archivo existente.',
      );
      return;
    }

    setCargando(true);
    try {
      const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (resultado.canceled || !resultado.assets[0]) return;

      const asset = resultado.assets[0];
      const tipo = normalizarTipo(asset.mimeType ?? 'image/jpeg');

      if (!tipoValido(tipo) || !pesoValido(asset.fileSize)) {
        Alert.alert('Documento inválido', MENSAJE_INVALIDO);
        return;
      }

      setPendiente({ uri: asset.uri, tipo });
    } finally {
      setCargando(false);
    }
  };

  const abrirDocumento = async (): Promise<void> => {
    setCargando(true);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: LIMITES.documento.formatos as unknown as string[],
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets[0]) return;

      const asset = resultado.assets[0];
      const tipo = normalizarTipo(asset.mimeType ?? 'application/pdf');

      if (!tipoValido(tipo) || !pesoValido(asset.size ?? undefined)) {
        Alert.alert('Documento inválido', MENSAJE_INVALIDO);
        return;
      }

      // El pdf no pasa por el editor: recortar/rotar sólo tiene sentido para una imagen.
      if (tipo === 'application/pdf') {
        onChange({
          uri: asset.uri,
          nombre: asset.name || `comprobante.${EXTENSION_POR_TIPO[tipo] ?? 'pdf'}`,
          tipo,
          esImagen: false,
        });
        return;
      }

      setPendiente({ uri: asset.uri, tipo });
    } finally {
      setCargando(false);
    }
  };

  const elegir = (): void => {
    Alert.alert('Adjuntar comprobante', '¿De dónde lo subís?', [
      { text: 'Cámara', onPress: () => void abrirCamara() },
      { text: 'Galería', onPress: () => void abrirGaleria() },
      { text: 'Archivo (PDF o imagen)', onPress: () => void abrirDocumento() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // Prioridad: el archivo elegido en esta sesión > el que ya tenía el registro (edición).
  const nombreVisible = documento?.nombre ?? nombreExistente ?? null;
  const hayArchivo = documento !== null || Boolean(urlExistente);

  return (
    <View>
      <Text
        className={`mb-1.5 font-semibold uppercase tracking-wide text-gray-400 ${
          grande ? 'text-[13px]' : 'text-[9px]'
        }`}
      >
        Documento
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adjuntar comprobante médico"
        onPress={elegir}
        disabled={cargando}
        className={`flex-row items-center rounded-xl border-[1.5px] border-dashed ${
          grande ? 'gap-3 px-4 py-3.5' : 'gap-2.5 px-3 py-2.5'
        } ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}
      >
        {cargando ? (
          <ActivityIndicator color="#FF9D5C" />
        ) : hayArchivo ? (
          documento?.esImagen ? (
            <Image
              source={{ uri: documento.uri }}
              className={grande ? 'h-11 w-11 rounded-lg' : 'h-8 w-8 rounded-lg'}
            />
          ) : (
            <View
              className={`items-center justify-center rounded-lg bg-pethood-orange ${
                grande ? 'h-11 w-11' : 'h-8 w-8'
              }`}
            >
              <Ionicons name="document-text" size={grande ? 20 : 16} color="#FFFFFF" />
            </View>
          )
        ) : (
          <Ionicons name="cloud-upload-outline" size={grande ? 23 : 18} color="#9CA3AF" />
        )}

        <Text
          className={`flex-1 ${grande ? 'text-base' : 'text-sm'} ${hayArchivo ? 'text-gray-800' : 'text-gray-400'}`}
          numberOfLines={1}
        >
          {nombreVisible ?? 'Adjuntar archivo...'}
        </Text>

        {/* Solo se puede deshacer una selección nueva, no borrar el documento ya guardado
            sin reemplazarlo: HU-8.3 solo contempla reemplazar el comprobante. */}
        {documento ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Deshacer la selección"
            onPress={() => onChange(null)}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={grande ? 21 : 18} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </Pressable>

      {error ? (
        <Text className={`mt-1 text-red-500 ${grande ? 'text-sm' : 'text-xs'}`}>{error}</Text>
      ) : null}

      <EditorFotoModal
        visible={pendiente !== null}
        uri={pendiente?.uri ?? ''}
        onCancelar={() => setPendiente(null)}
        onConfirmar={(resultado) => {
          // Si el editor no tocó nada (sin girar ni recortar) devuelve la misma uri de
          // entrada y conserva el formato original; si reescribió el archivo, siempre
          // sale como jpeg.
          const seReescribio = resultado.uri !== pendiente!.uri;
          const tipoFinal = seReescribio ? 'image/jpeg' : pendiente!.tipo;

          onChange({
            uri: resultado.uri,
            nombre: `comprobante.${EXTENSION_POR_TIPO[tipoFinal] ?? 'jpg'}`,
            tipo: tipoFinal,
            esImagen: true,
          });
          setPendiente(null);
        }}
      />
    </View>
  );
}
