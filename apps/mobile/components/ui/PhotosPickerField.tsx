/**
 * Varias fotos con orden: la primera es la portada. Se agregan de a una desde galería o
 * cámara, se reordenan con las flechas y se quitan con la cruz.
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { elegirArchivosWeb } from '@/lib/elegirImagen';
import { LIMITES } from '../../shared/validation/limits';
import { PALETA } from '@/constants/theme';

import { FotoPreviewModal } from './FotoPreviewModal';

export interface FotoElegida {
  uri: string;
  nombre: string;
  tipo: string;
}

interface PhotosPickerFieldProps {
  fotos: FotoElegida[];
  onChange: (fotos: FotoElegida[]) => void;
  maximo: number;
  error?: string;
}

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function tipoDesdeUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();

  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/** Algunos dispositivos Android devuelven 'image/jpg', que no es un MIME type real. */
function normalizarTipo(tipo: string): string {
  const minuscula = tipo.toLowerCase().trim();
  return minuscula === 'image/jpg' ? 'image/jpeg' : minuscula;
}

export function PhotosPickerField({ fotos, onChange, maximo, error }: PhotosPickerFieldProps) {
  const [cargando, setCargando] = useState(false);
  /** Fotos recién elegidas, en revisión de a una en el modal de vista previa. */
  const [cola, setCola] = useState<FotoElegida[]>([]);

  const lleno = fotos.length >= maximo;

  const procesar = (resultado: ImagePicker.ImagePickerResult): void => {
    if (resultado.canceled) return;

    const nuevas: FotoElegida[] = [];
    const reservadas = fotos.length + cola.length;

    for (const asset of resultado.assets) {
      if (reservadas + nuevas.length >= maximo) break;

      const tipo = normalizarTipo(asset.mimeType ?? tipoDesdeUri(asset.uri));

      if (!LIMITES.imagen.formatos.includes(tipo as never)) {
        Alert.alert('Formato no admitido', 'Subí imágenes en JPG, PNG o WEBP.');
        continue;
      }

      if (asset.fileSize && asset.fileSize > LIMITES.imagen.tamanioMaximoBytes) {
        Alert.alert('La foto es muy pesada', 'Cada imagen tiene que pesar menos de 5 MB.');
        continue;
      }

      const extension = EXTENSION_POR_TIPO[tipo] ?? 'jpg';
      nuevas.push({ uri: asset.uri, nombre: `foto-${Date.now()}-${nuevas.length}.${extension}`, tipo });
    }

    // No se agregan todavía: pasan una por una por la vista previa, donde se pueden girar.
    if (nuevas.length > 0) setCola((previa) => [...previa, ...nuevas]);
  };

  const abrirGaleria = async (): Promise<void> => {
    setCargando(true);
    try {
      procesar(
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: maximo - fotos.length,
        }),
      );
    } finally {
      setCargando(false);
    }
  };

  const abrirCamara = async (): Promise<void> => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        'Necesitamos la cámara',
        'Dale permiso a PetHood para usar la cámara, o elegí fotos de la galería.',
      );
      return;
    }

    setCargando(true);
    try {
      // Foto única: acá sí hay recorte nativo antes de pasar a la vista previa.
      procesar(await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true }));
    } finally {
      setCargando(false);
    }
  };

  const elegir = (): void => {
    if (lleno) {
      Alert.alert('Llegaste al máximo', `Podés subir hasta ${maximo} fotos.`);
      return;
    }

    if (Platform.OS === 'web') {
      void elegirArchivosWeb(true).then((assets) => {
        if (assets.length > 0) procesar({ canceled: false, assets });
      });
      return;
    }

    Alert.alert('Agregar foto', '¿De dónde la sacamos?', [
      { text: 'Cámara', onPress: () => void abrirCamara() },
      { text: 'Galería', onPress: () => void abrirGaleria() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const mover = (desde: number, hacia: number): void => {
    if (hacia < 0 || hacia >= fotos.length) return;

    const reordenadas = [...fotos];
    const [movida] = reordenadas.splice(desde, 1);
    reordenadas.splice(hacia, 0, movida!);
    onChange(reordenadas);
  };

  const quitar = (indice: number): void => onChange(fotos.filter((_, i) => i !== indice));

  return (
    <View className="mb-4">
      {fotos.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar fotos"
          onPress={elegir}
          disabled={cargando}
          className={`h-40 items-center justify-center rounded-3xl border-2 border-dashed ${
            error ? 'border-red-300 bg-red-50' : 'border-pethood-orange/40 bg-white/60'
          }`}
        >
          {cargando ? (
            <ActivityIndicator color={PALETA.pethood.naranja} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={36} color={PALETA.pethood.naranja} />
              <Text className="mt-2 text-base font-medium text-gray-500">Agregar fotos</Text>
              <Text className="mt-0.5 text-sm text-gray-400">Hasta {maximo}</Text>
            </>
          )}
        </Pressable>
      ) : (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {fotos.map((foto, indice) => (
              <View key={foto.uri} className="mx-1 w-36">
                <View className="relative">
                  <Image source={{ uri: foto.uri }} className="h-36 w-36 rounded-2xl" />

                  {indice === 0 ? (
                    <View className="absolute left-2 top-2 rounded-full bg-pethood-orange px-2.5 py-1">
                      <Text className="text-xs font-semibold text-white">Portada</Text>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar foto ${indice + 1}`}
                    onPress={() => quitar(indice)}
                    hitSlop={6}
                    className="absolute right-1.5 top-1.5 h-8 w-8 items-center justify-center rounded-full bg-black/50 active:opacity-80"
                  >
                    <Ionicons name="close" size={18} color={PALETA.blanco} />
                  </Pressable>
                </View>

                <View className="mt-2 flex-row justify-center gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mover foto ${indice + 1} hacia la izquierda`}
                    disabled={indice === 0}
                    onPress={() => mover(indice, indice - 1)}
                    hitSlop={6}
                    className={`h-8 w-10 items-center justify-center rounded-lg bg-white ${
                      indice === 0 ? 'opacity-30' : 'active:opacity-70'
                    }`}
                  >
                    <Ionicons name="chevron-back" size={18} color={PALETA.gris[500]} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mover foto ${indice + 1} hacia la derecha`}
                    disabled={indice === fotos.length - 1}
                    onPress={() => mover(indice, indice + 1)}
                    hitSlop={6}
                    className={`h-8 w-10 items-center justify-center rounded-lg bg-white ${
                      indice === fotos.length - 1 ? 'opacity-30' : 'active:opacity-70'
                    }`}
                  >
                    <Ionicons name="chevron-forward" size={18} color={PALETA.gris[500]} />
                  </Pressable>
                </View>
              </View>
            ))}

            {!lleno ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Agregar otra foto"
                onPress={elegir}
                disabled={cargando}
                className="mx-1 h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-pethood-orange/40 bg-white/60"
              >
                {cargando ? (
                  <ActivityIndicator color={PALETA.pethood.naranja} />
                ) : (
                  <>
                    <Ionicons name="add" size={30} color={PALETA.pethood.naranja} />
                    <Text className="mt-1 text-sm text-gray-500">Agregar</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </ScrollView>

          <Text className="mt-2.5 text-sm text-gray-400">
            {fotos.length} de {maximo} · la primera es la portada
          </Text>
        </View>
      )}

      {error ? <Text className="mt-1.5 text-xs text-red-500">{error}</Text> : null}

      <FotoPreviewModal
        visible={cola.length > 0}
        uri={cola[0]?.uri ?? ''}
        onCancelar={() => setCola((previa) => previa.slice(1))}
        onConfirmar={(resultado) => {
          const actual = cola[0]!;
          onChange([
            ...fotos,
            {
              uri: resultado.uri,
              nombre: resultado.seReescribioComoJpeg
                ? actual.nombre.replace(/\.\w+$/, '.jpg')
                : actual.nombre,
              tipo: resultado.seReescribioComoJpeg ? 'image/jpeg' : actual.tipo,
            },
          ]);
          setCola((previa) => previa.slice(1));
        }}
      />
    </View>
  );
}
