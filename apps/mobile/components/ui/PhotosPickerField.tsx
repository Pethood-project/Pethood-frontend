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

  const lleno = fotos.length >= maximo;

  const procesar = (resultado: ImagePicker.ImagePickerResult): void => {
    if (resultado.canceled) return;

    const nuevas: FotoElegida[] = [];

    for (const asset of resultado.assets) {
      if (fotos.length + nuevas.length >= maximo) break;

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

    if (nuevas.length > 0) onChange([...fotos, ...nuevas]);
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
      procesar(await ImagePicker.launchCameraAsync({ quality: 0.8 }));
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
          className={`h-32 items-center justify-center rounded-3xl border-2 border-dashed ${
            error ? 'border-red-300 bg-red-50' : 'border-pethood-orange/40 bg-white/60'
          }`}
        >
          {cargando ? (
            <ActivityIndicator color={PALETA.pethood.naranja} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={28} color={PALETA.pethood.naranja} />
              <Text className="mt-1.5 text-sm font-medium text-gray-500">Agregar fotos</Text>
              <Text className="mt-0.5 text-xs text-gray-400">Hasta {maximo}</Text>
            </>
          )}
        </Pressable>
      ) : (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {fotos.map((foto, indice) => (
              <View key={foto.uri} className="mx-1 w-32">
                <View className="relative">
                  <Image source={{ uri: foto.uri }} className="h-32 w-32 rounded-2xl" />

                  {indice === 0 ? (
                    <View className="absolute left-2 top-2 rounded-full bg-pethood-orange px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-white">Portada</Text>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar foto ${indice + 1}`}
                    onPress={() => quitar(indice)}
                    hitSlop={6}
                    className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/50 active:opacity-80"
                  >
                    <Ionicons name="close" size={16} color={PALETA.blanco} />
                  </Pressable>
                </View>

                <View className="mt-1.5 flex-row justify-center gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mover foto ${indice + 1} hacia la izquierda`}
                    disabled={indice === 0}
                    onPress={() => mover(indice, indice - 1)}
                    hitSlop={6}
                    className={`h-7 w-9 items-center justify-center rounded-lg bg-white ${
                      indice === 0 ? 'opacity-30' : 'active:opacity-70'
                    }`}
                  >
                    <Ionicons name="chevron-back" size={16} color={PALETA.gris[500]} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mover foto ${indice + 1} hacia la derecha`}
                    disabled={indice === fotos.length - 1}
                    onPress={() => mover(indice, indice + 1)}
                    hitSlop={6}
                    className={`h-7 w-9 items-center justify-center rounded-lg bg-white ${
                      indice === fotos.length - 1 ? 'opacity-30' : 'active:opacity-70'
                    }`}
                  >
                    <Ionicons name="chevron-forward" size={16} color={PALETA.gris[500]} />
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
                className="mx-1 h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-pethood-orange/40 bg-white/60"
              >
                {cargando ? (
                  <ActivityIndicator color={PALETA.pethood.naranja} />
                ) : (
                  <>
                    <Ionicons name="add" size={26} color={PALETA.pethood.naranja} />
                    <Text className="mt-1 text-xs text-gray-500">Agregar</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </ScrollView>

          <Text className="mt-2 text-xs text-gray-400">
            {fotos.length} de {maximo} · la primera es la portada
          </Text>
        </View>
      )}

      {error ? <Text className="mt-1.5 text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
