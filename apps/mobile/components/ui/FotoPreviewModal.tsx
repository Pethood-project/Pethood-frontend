/**
 * Paso previo a aceptar una foto de mascota: la muestra grande, deja girarla en pasos de
 * 90° y recién ahí confirmarla o descartarla.
 *
 * Existe porque muchas fotos de galería llegan rotadas (el EXIF dice "vertical" pero el
 * picker no la reacomoda) y hasta ahora esa rotación solo se notaba después de subida, en
 * la publicación ya creada.
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';

import { PALETA } from '@/constants/theme';

export interface FotoConfirmada {
  uri: string;
  /** `true` cuando se giró la foto: el archivo resultante siempre se reescribe como JPEG. */
  seReescribioComoJpeg: boolean;
}

interface FotoPreviewModalProps {
  visible: boolean;
  uri: string;
  onCancelar: () => void;
  onConfirmar: (resultado: FotoConfirmada) => void;
}

export function FotoPreviewModal({ visible, uri, onCancelar, onConfirmar }: FotoPreviewModalProps) {
  const [grados, setGrados] = useState(0);
  const [procesando, setProcesando] = useState(false);

  const rotar = (): void => setGrados((previo) => (previo + 90) % 360);

  const confirmar = async (): Promise<void> => {
    if (grados === 0) {
      onConfirmar({ uri, seReescribioComoJpeg: false });
      return;
    }

    setProcesando(true);
    try {
      const resultado = await ImageManipulator.manipulateAsync(uri, [{ rotate: grados }], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      onConfirmar({ uri: resultado.uri, seReescribioComoJpeg: true });
    } finally {
      setProcesando(false);
      setGrados(0);
    }
  };

  const cancelar = (): void => {
    setGrados(0);
    onCancelar();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancelar}>
      <View className="flex-1 items-center justify-center bg-black/80 px-6">
        <View className="w-full items-center">
          <View className="h-80 w-full items-center justify-center overflow-hidden rounded-3xl bg-black">
            {uri ? (
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%', transform: [{ rotate: `${grados}deg` }] }}
                resizeMode="contain"
                accessibilityLabel="Vista previa de la foto"
              />
            ) : null}
          </View>

          <Text className="mt-3 text-center text-sm text-white/80">
            Giralá si hace falta y confirmá cuando se vea bien.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rotar la foto"
            onPress={rotar}
            disabled={procesando}
            className="mt-4 flex-row items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 active:opacity-80"
          >
            <Ionicons name="reload-outline" size={18} color={PALETA.blanco} />
            <Text className="text-sm font-medium text-white">Rotar</Text>
          </Pressable>

          <View className="mt-6 w-full flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              disabled={procesando}
              onPress={cancelar}
              className="flex-1 items-center justify-center rounded-2xl border border-white/30 py-3.5 active:opacity-80"
            >
              <Text className="text-base font-semibold text-white">Cancelar</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: procesando }}
              disabled={procesando}
              onPress={() => void confirmar()}
              className={`flex-1 items-center justify-center rounded-2xl bg-pethood-orange py-3.5 active:opacity-90 ${
                procesando ? 'opacity-60' : ''
              }`}
            >
              {procesando ? (
                <ActivityIndicator color={PALETA.blanco} />
              ) : (
                <Text className="text-base font-semibold text-white">Usar esta foto</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
