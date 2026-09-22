/**
 * Visor de los adjuntos de un mensaje a pantalla completa, con paginación horizontal entre
 * ellos (HU-5.2). Una foto se amplía con pellizco; un video se reproduce con los controles
 * nativos.
 *
 * Se arma con `react-native-gesture-handler` y `react-native-reanimated`, que ya son
 * dependencias del proyecto: una librería de galería traería un módulo nativo y el equipo
 * prueba con Expo Go.
 *
 * Los gestos corren en el hilo de UI (worklets de Reanimated), así que el zoom sigue al
 * dedo aunque el hilo de JS esté ocupado recibiendo mensajes por el socket.
 *
 * Deslizar entre fotos y arrastrar una foto ampliada son el MISMO gesto (un dedo en
 * horizontal), así que se reparten por estado: sin zoom manda el scroll paginado y el
 * arrastre está apagado; con zoom se apaga el scroll y el arrastre reencuadra. Al cambiar de
 * página la foto que se deja vuelve a su tamaño, para no volver a ella y encontrarla ampliada.
 */
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from 'react-native-gesture-handler';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PALETA } from '@/constants/theme';
import type { Adjunto } from '@/lib/adjuntos';

/** Hasta dónde se puede agrandar. Más allá de 5× una foto de celular ya es un mosaico. */
const ESCALA_MAXIMA = 5;
/** A cuánto lleva el doble toque. */
const ESCALA_DOBLE_TOQUE = 2.5;

interface VisorAdjuntosProps {
  /** Todos los adjuntos del mensaje, en orden. */
  adjuntos: Adjunto[];
  /** Cuál se abre primero, o `null` para mantener el visor cerrado. */
  indiceInicial: number | null;
  onCerrar: () => void;
}

/**
 * Deja la imagen dentro de la pantalla: sin esto se puede arrastrar hasta perderla de
 * vista y no hay forma de traerla de vuelta.
 *
 * El margen que se puede desplazar es la mitad de lo que la imagen creció respecto de la
 * pantalla, porque el punto de origen del escalado es el centro.
 */
function limitar(valor: number, limite: number): number {
  'worklet';
  return Math.min(Math.max(valor, -limite), limite);
}

interface PaginaVisorProps {
  uri: string;
  ancho: number;
  alto: number;
  /** `false` cuando el usuario se fue a otra foto: la ampliación se descarta. */
  activa: boolean;
  /** Avisa cuando la foto entra o sale del zoom, para prender o apagar el scroll. */
  onZoom: (activo: boolean) => void;
}

/** Una foto con sus gestos. Cada página tiene su propio zoom, independiente de las demás. */
function PaginaVisor({ uri, ancho, alto, activa, onZoom }: PaginaVisorProps) {
  const escala = useSharedValue(1);
  const escalaPrevia = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xPrevia = useSharedValue(0);
  const yPrevia = useSharedValue(0);

  const [conZoom, setConZoom] = useState(false);

  // El estado de zoom se necesita en JS —para el `scrollEnabled` del paginador y el
  // `enabled` del arrastre—, así que se refleja desde el hilo de UI sólo cuando cambia.
  useAnimatedReaction(
    () => escala.value > 1,
    (ampliada, anterior) => {
      if (ampliada !== anterior) runOnJS(setConZoom)(ampliada);
    },
  );

  useEffect(() => {
    onZoom(conZoom);
  }, [conZoom, onZoom]);

  const reiniciar = useCallback((): void => {
    escala.value = withTiming(1);
    escalaPrevia.value = 1;
    x.value = withTiming(0);
    y.value = withTiming(0);
    xPrevia.value = 0;
    yPrevia.value = 0;
  }, [escala, escalaPrevia, x, y, xPrevia, yPrevia]);

  // Al dejar la página, la foto vuelve a su tamaño: si el usuario vuelve, la encuentra
  // entera y no un recorte ampliado de la vez anterior.
  useEffect(() => {
    if (!activa) reiniciar();
  }, [activa, reiniciar]);

  /** Corrige el desplazamiento cuando la imagen ya no puede salirse de la pantalla. */
  const ajustarDentroDeLimites = (): void => {
    'worklet';
    const maximoX = Math.max(0, (ancho * escala.value - ancho) / 2);
    const maximoY = Math.max(0, (alto * escala.value - alto) / 2);

    x.value = withTiming(limitar(x.value, maximoX));
    y.value = withTiming(limitar(y.value, maximoY));
    xPrevia.value = limitar(xPrevia.value, maximoX);
    yPrevia.value = limitar(yPrevia.value, maximoY);
  };

  // Pellizco: el gesto de separar y juntar los dedos.
  const pellizco = Gesture.Pinch()
    .onUpdate((evento) => {
      escala.value = Math.min(escalaPrevia.value * evento.scale, ESCALA_MAXIMA);
    })
    .onEnd(() => {
      // Achicar por debajo del tamaño original y soltar devuelve la foto a su lugar, en vez
      // de dejarla diminuta y descentrada.
      if (escala.value < 1) {
        escala.value = withTiming(1);
        escalaPrevia.value = 1;
        x.value = withTiming(0);
        y.value = withTiming(0);
        xPrevia.value = 0;
        yPrevia.value = 0;
        return;
      }

      escalaPrevia.value = escala.value;
      ajustarDentroDeLimites();
    });

  // Arrastre: sólo con la foto ampliada. Apagado, el dedo en horizontal es del paginador,
  // que es lo que permite pasar a la foto siguiente.
  const arrastre = Gesture.Pan()
    .enabled(conZoom)
    .onUpdate((evento) => {
      x.value = xPrevia.value + evento.translationX;
      y.value = yPrevia.value + evento.translationY;
    })
    .onEnd(() => {
      xPrevia.value = x.value;
      yPrevia.value = y.value;
      ajustarDentroDeLimites();
    });

  // Doble toque: el atajo de siempre para ampliar sin hacer el pellizco.
  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (escala.value > 1) {
        escala.value = withTiming(1);
        escalaPrevia.value = 1;
        x.value = withTiming(0);
        y.value = withTiming(0);
        xPrevia.value = 0;
        yPrevia.value = 0;
        return;
      }

      escala.value = withTiming(ESCALA_DOBLE_TOQUE);
      escalaPrevia.value = ESCALA_DOBLE_TOQUE;
    });

  // Pellizco y arrastre a la vez: con la foto ampliada se puede reencuadrar sin soltar.
  // El doble toque va aparte para que no se dispare durante un pellizco.
  const gestos = Gesture.Exclusive(Gesture.Simultaneous(pellizco, arrastre), dobleToque);

  const estiloImagen = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: escala.value }],
  }));

  return (
    <GestureDetector gesture={gestos}>
      <Animated.View style={{ width: ancho, height: alto }} className="items-center justify-center">
        <Animated.Image
          source={{ uri }}
          style={[{ width: ancho, height: alto }, estiloImagen]}
          resizeMode="contain"
          accessibilityLabel="Foto del mensaje ampliada"
        />
      </Animated.View>
    </GestureDetector>
  );
}

interface PaginaVideoProps {
  uri: string;
  ancho: number;
  alto: number;
  /** `false` cuando el usuario se fue a otro adjunto: el video se pausa. */
  activa: boolean;
}

/**
 * Un video a pantalla completa, con los controles nativos de la plataforma.
 *
 * Sin gestos propios: reproducir, pausar y buscar ya los resuelve el reproductor, y sumarle
 * pellizco y arrastre encima le robaría los toques a su barra de progreso. Por eso tampoco
 * avisa de zoom: en una página de video el paginador queda siempre habilitado.
 *
 * Al salir de la página se pausa. Sin esto, deslizar al siguiente adjunto dejaría el audio
 * sonando desde una página que ya no se ve.
 */
function PaginaVideo({ uri, ancho, alto, activa }: PaginaVideoProps) {
  const player = useVideoPlayer(uri);

  useEffect(() => {
    if (activa) {
      player.play();
    } else {
      player.pause();
    }
  }, [activa, player]);

  return (
    <View style={{ width: ancho, height: alto }} className="items-center justify-center">
      <VideoView
        player={player}
        style={{ width: ancho, height: alto }}
        contentFit="contain"
        nativeControls
        // El visor YA es pantalla completa: el botón del reproductor abriría un fullscreen
        // nativo por encima de este Modal, que es el mismo tamaño con otra forma de salir.
        fullscreenOptions={{ enable: false }}
      />
    </View>
  );
}

export function VisorAdjuntos({ adjuntos, indiceInicial, onCerrar }: VisorAdjuntosProps) {
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();

  const abierto = indiceInicial !== null && adjuntos.length > 0;

  const [indice, setIndice] = useState(0);
  const [conZoom, setConZoom] = useState(false);

  // Cada apertura arranca en el adjunto que se tocó, con el scroll habilitado.
  useEffect(() => {
    if (abierto) {
      setIndice(indiceInicial);
      setConZoom(false);
    }
  }, [abierto, indiceInicial]);

  const alTerminarDeDeslizar = (evento: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const pagina = Math.round(evento.nativeEvent.contentOffset.x / anchoPantalla);
    setIndice(Math.min(Math.max(pagina, 0), adjuntos.length - 1));
  };

  return (
    <Modal
      visible={abierto}
      transparent
      animationType="fade"
      // Android: sin esto el botón físico de retroceso no cierra el visor.
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      {/* Gesture handler necesita su propia raíz DENTRO del Modal: el `GestureHandlerRootView`
          del layout no alcanza porque el Modal se monta en otra jerarquía nativa. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black">
          {/* Se monta sólo abierto: así `contentOffset` posiciona en el adjunto tocado en
              CADA apertura y no sólo en la primera. */}
          {abierto ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              // Con una foto ampliada el dedo reencuadra; el paginador se apaga para no
              // pelear por el mismo gesto.
              scrollEnabled={!conZoom}
              contentOffset={{ x: indiceInicial * anchoPantalla, y: 0 }}
              onMomentumScrollEnd={alTerminarDeDeslizar}
            >
              {adjuntos.map((adjunto, posicion) =>
                adjunto.tipo === 'VIDEO' ? (
                  <PaginaVideo
                    key={`${adjunto.uri}-${posicion}`}
                    uri={adjunto.uri}
                    ancho={anchoPantalla}
                    alto={altoPantalla}
                    activa={posicion === indice}
                  />
                ) : (
                  <PaginaVisor
                    key={`${adjunto.uri}-${posicion}`}
                    uri={adjunto.uri}
                    ancho={anchoPantalla}
                    alto={altoPantalla}
                    activa={posicion === indice}
                    onZoom={setConZoom}
                  />
                ),
              )}
            </ScrollView>
          ) : null}

          {/* Fuera del paginador para que el gesto de zoom no se coma el toque. */}
          <SafeAreaView className="absolute left-0 right-0 top-0" edges={['top']}>
            <View className="flex-row items-center justify-between p-3">
              {/* "2 de 5", como en la galería de la publicación. Con un solo adjunto no
                  aporta nada y se omite. */}
              {adjuntos.length > 1 ? (
                <View className="rounded-full bg-black/50 px-3 py-1.5">
                  <Text className="font-cuerpo-semi text-[13px] text-white">
                    {`${indice + 1} de ${adjuntos.length}`}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={onCerrar}
                hitSlop={12}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/50 active:opacity-70"
              >
                <Ionicons name="close" size={22} color={PALETA.blanco} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
