/**
 * Paso previo a aceptar una foto (historia clínica, chat): la muestra grande, deja
 * girarla en pasos de 90° y recortarla arrastrando un rectángulo, y recién ahí se
 * confirma o descarta.
 *
 * Reusa `expo-image-manipulator` (ya dependencia del proyecto, ver `FotoPreviewModal`,
 * que hace lo mismo solo con rotación) tanto para la rotación como para el recorte
 * final: el resultado ya sale recortado/rotado en disco, así que el resto de la app lo
 * sube como un archivo normal, sin mandar coordenadas al backend.
 *
 * El recuadro de recorte se arrastra con `react-native-gesture-handler` +
 * `react-native-reanimated`, igual mecanismo que `VisorAdjuntos` (zoom de las fotos del
 * chat): son dependencias que ya están instaladas y el equipo prueba con Expo Go, así
 * que no hace falta una librería de recorte con módulo nativo propio.
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { PALETA } from '@/constants/theme';

export interface FotoEditada {
  uri: string;
  ancho: number;
  alto: number;
}

interface EditorFotoModalProps {
  visible: boolean;
  uri: string;
  onCancelar: () => void;
  onConfirmar: (resultado: FotoEditada) => void;
}

interface Dimensiones {
  uri: string;
  ancho: number;
  alto: number;
}

/** La imagen dentro del modal no crece más allá de esto ni se deforma. */
const ANCHO_MAXIMO = 520;
const ALTO_MAXIMO = 420;
/** Lado mínimo del recuadro de recorte en píxeles de PANTALLA, para que no quede inservible. */
const RECORTE_MINIMO = 44;
/** Lado del handle de las esquinas (debe coincidir con las clases `h-6 w-6` de abajo). */
const HANDLE = 24;

function calcularCaja(ancho: number, alto: number, anchoDisponible: number) {
  const anchoMaximo = Math.min(ANCHO_MAXIMO, anchoDisponible);
  const escala = Math.min(anchoMaximo / ancho, ALTO_MAXIMO / alto);
  return { ancho: ancho * escala, alto: alto * escala };
}

export function EditorFotoModal({ visible, uri, onCancelar, onConfirmar }: EditorFotoModalProps) {
  const { width: anchoPantalla } = useWindowDimensions();
  const anchoDisponible = anchoPantalla - 48;

  const [original, setOriginal] = useState<Dimensiones | null>(null);
  /** Resultado de la última rotación, o `null` si está en 0° (se usa `original` tal cual). */
  const [rotada, setRotada] = useState<Dimensiones | null>(null);
  const [gradosAcumulados, setGradosAcumulados] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const actual = rotada ?? original;
  const caja = actual ? calcularCaja(actual.ancho, actual.alto, anchoDisponible) : null;
  const anchoCaja = caja?.ancho ?? 0;
  const altoCaja = caja?.alto ?? 0;

  // Rectángulo de recorte en píxeles de PANTALLA, dentro de la caja. Shared values porque
  // se arrastran a 60fps con gestos; solo se leen desde JS al confirmar.
  const left = useSharedValue(0);
  const top = useSharedValue(0);
  const right = useSharedValue(0);
  const bottom = useSharedValue(0);
  const inicio = useSharedValue({ left: 0, top: 0, right: 0, bottom: 0 });

  const reiniciarRecorte = (anchoNuevo: number, altoNuevo: number): void => {
    left.value = 0;
    top.value = 0;
    right.value = anchoNuevo;
    bottom.value = altoNuevo;
  };

  // Al abrirse con una foto nueva se mide su tamaño real y arranca sin rotación ni recorte.
  useEffect(() => {
    if (!visible || !uri) return;

    let cancelado = false;
    setCargando(true);
    setRotada(null);
    setGradosAcumulados(0);

    Image.getSize(
      uri,
      (ancho, alto) => {
        if (cancelado) return;
        setOriginal({ uri, ancho, alto });
        const nuevaCaja = calcularCaja(ancho, alto, anchoDisponible);
        reiniciarRecorte(nuevaCaja.ancho, nuevaCaja.alto);
        setCargando(false);
      },
      () => {
        if (!cancelado) setCargando(false);
      },
    );

    return () => {
      cancelado = true;
    };
    // Solo cuando cambia la foto de entrada: `anchoDisponible` recalcula la caja por su
    // cuenta en cada render sin tener que reabrir el modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, uri]);

  const rotar = async (): Promise<void> => {
    if (!original) return;

    const nuevosGrados = (gradosAcumulados + 90) % 360;
    setProcesando(true);
    try {
      if (nuevosGrados === 0) {
        setRotada(null);
        setGradosAcumulados(0);
        const nuevaCaja = calcularCaja(original.ancho, original.alto, anchoDisponible);
        reiniciarRecorte(nuevaCaja.ancho, nuevaCaja.alto);
        return;
      }

      const resultado = await ImageManipulator.manipulateAsync(
        original.uri,
        [{ rotate: nuevosGrados }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );

      setRotada({ uri: resultado.uri, ancho: resultado.width, alto: resultado.height });
      setGradosAcumulados(nuevosGrados);
      const nuevaCaja = calcularCaja(resultado.width, resultado.height, anchoDisponible);
      reiniciarRecorte(nuevaCaja.ancho, nuevaCaja.alto);
    } finally {
      setProcesando(false);
    }
  };

  const gestoEsquina = (esquina: 'tl' | 'tr' | 'bl' | 'br') =>
    Gesture.Pan()
      .onBegin(() => {
        inicio.value = { left: left.value, top: top.value, right: right.value, bottom: bottom.value };
      })
      .onUpdate((evento) => {
        const ini = inicio.value;

        if (esquina === 'tl' || esquina === 'bl') {
          left.value = Math.min(Math.max(ini.left + evento.translationX, 0), right.value - RECORTE_MINIMO);
        } else {
          right.value = Math.max(
            Math.min(ini.right + evento.translationX, anchoCaja),
            left.value + RECORTE_MINIMO,
          );
        }

        if (esquina === 'tl' || esquina === 'tr') {
          top.value = Math.min(Math.max(ini.top + evento.translationY, 0), bottom.value - RECORTE_MINIMO);
        } else {
          bottom.value = Math.max(
            Math.min(ini.bottom + evento.translationY, altoCaja),
            top.value + RECORTE_MINIMO,
          );
        }
      });

  const gestoMover = Gesture.Pan()
    .onBegin(() => {
      inicio.value = { left: left.value, top: top.value, right: right.value, bottom: bottom.value };
    })
    .onUpdate((evento) => {
      const ini = inicio.value;
      const anchoRecorte = ini.right - ini.left;
      const altoRecorte = ini.bottom - ini.top;

      const nuevoLeft = Math.min(Math.max(ini.left + evento.translationX, 0), anchoCaja - anchoRecorte);
      const nuevoTop = Math.min(Math.max(ini.top + evento.translationY, 0), altoCaja - altoRecorte);

      left.value = nuevoLeft;
      top.value = nuevoTop;
      right.value = nuevoLeft + anchoRecorte;
      bottom.value = nuevoTop + altoRecorte;
    });

  const estiloRecorte = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    top: top.value,
    width: right.value - left.value,
    height: bottom.value - top.value,
  }));

  const estiloTapaSuperior = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: top.value,
  }));
  const estiloTapaInferior = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: bottom.value,
    bottom: 0,
  }));
  const estiloTapaIzquierda = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: top.value,
    width: left.value,
    height: bottom.value - top.value,
  }));
  const estiloTapaDerecha = useAnimatedStyle(() => ({
    position: 'absolute',
    left: right.value,
    right: 0,
    top: top.value,
    height: bottom.value - top.value,
  }));

  // Los cuatro se declaran siempre, sin condicionar por `listo`: son hooks y tienen que
  // llamarse en el mismo orden en todos los renders, aunque el JSX que los usa esté
  // condicionado (mientras carga la imagen no se muestran, pero el hook igual corre).
  const estiloHandleTL = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value - HANDLE / 2,
    top: top.value - HANDLE / 2,
  }));
  const estiloHandleTR = useAnimatedStyle(() => ({
    position: 'absolute',
    left: right.value - HANDLE / 2,
    top: top.value - HANDLE / 2,
  }));
  const estiloHandleBL = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value - HANDLE / 2,
    top: bottom.value - HANDLE / 2,
  }));
  const estiloHandleBR = useAnimatedStyle(() => ({
    position: 'absolute',
    left: right.value - HANDLE / 2,
    top: bottom.value - HANDLE / 2,
  }));

  const confirmar = async (): Promise<void> => {
    if (!actual || !caja) return;

    setProcesando(true);
    try {
      const escalaInversa = actual.ancho / caja.ancho;
      const originX = Math.round(left.value * escalaInversa);
      const originY = Math.round(top.value * escalaInversa);
      const width = Math.round((right.value - left.value) * escalaInversa);
      const height = Math.round((bottom.value - top.value) * escalaInversa);

      const sinRecorte = originX <= 0 && originY <= 0 && width >= actual.ancho && height >= actual.alto;

      if (sinRecorte) {
        onConfirmar({ uri: actual.uri, ancho: actual.ancho, alto: actual.alto });
        return;
      }

      const resultado = await ImageManipulator.manipulateAsync(
        actual.uri,
        [
          {
            crop: {
              originX: Math.max(0, Math.min(originX, actual.ancho - 1)),
              originY: Math.max(0, Math.min(originY, actual.alto - 1)),
              width: Math.max(1, Math.min(width, actual.ancho - Math.max(0, originX))),
              height: Math.max(1, Math.min(height, actual.alto - Math.max(0, originY))),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );

      onConfirmar({ uri: resultado.uri, ancho: resultado.width, alto: resultado.height });
    } finally {
      setProcesando(false);
    }
  };

  const cancelar = (): void => {
    setGradosAcumulados(0);
    setRotada(null);
    onCancelar();
  };

  const listo = !cargando && caja !== null && actual !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancelar}>
      {/* Gesture handler necesita su propia raíz DENTRO del Modal, igual que en VisorAdjuntos. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-black/85 px-6">
          <View className="w-full items-center">
            {!listo || !caja ? (
              <View className="h-64 w-full items-center justify-center">
                <ActivityIndicator color={PALETA.blanco} />
              </View>
            ) : (
              <View
                style={{ width: caja.ancho, height: caja.alto }}
                className="overflow-hidden rounded-2xl bg-black"
              >
                <Image
                  source={{ uri: actual!.uri }}
                  style={{ width: caja.ancho, height: caja.alto }}
                  resizeMode="cover"
                  accessibilityLabel="Vista previa de la foto"
                />

                <Animated.View pointerEvents="none" style={estiloTapaSuperior} className="bg-black/60" />
                <Animated.View pointerEvents="none" style={estiloTapaInferior} className="bg-black/60" />
                <Animated.View pointerEvents="none" style={estiloTapaIzquierda} className="bg-black/60" />
                <Animated.View pointerEvents="none" style={estiloTapaDerecha} className="bg-black/60" />

                <GestureDetector gesture={gestoMover}>
                  <Animated.View style={estiloRecorte} className="border-2 border-white" />
                </GestureDetector>

                <GestureDetector gesture={gestoEsquina('tl')}>
                  <Animated.View
                    style={estiloHandleTL}
                    className="h-6 w-6 rounded-full border-2 border-white bg-pethood-orange"
                  />
                </GestureDetector>
                <GestureDetector gesture={gestoEsquina('tr')}>
                  <Animated.View
                    style={estiloHandleTR}
                    className="h-6 w-6 rounded-full border-2 border-white bg-pethood-orange"
                  />
                </GestureDetector>
                <GestureDetector gesture={gestoEsquina('bl')}>
                  <Animated.View
                    style={estiloHandleBL}
                    className="h-6 w-6 rounded-full border-2 border-white bg-pethood-orange"
                  />
                </GestureDetector>
                <GestureDetector gesture={gestoEsquina('br')}>
                  <Animated.View
                    style={estiloHandleBR}
                    className="h-6 w-6 rounded-full border-2 border-white bg-pethood-orange"
                  />
                </GestureDetector>
              </View>
            )}

            <Text className="mt-3 text-center text-sm text-white/80">
              Arrastrá el recuadro para recortar y giralo si hace falta.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rotar la foto"
              onPress={() => void rotar()}
              disabled={procesando || !listo}
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
                disabled={procesando || !listo}
                onPress={() => void confirmar()}
                className={`flex-1 items-center justify-center rounded-2xl bg-pethood-orange py-3.5 active:opacity-90 ${
                  procesando || !listo ? 'opacity-60' : ''
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
      </GestureHandlerRootView>
    </Modal>
  );
}
