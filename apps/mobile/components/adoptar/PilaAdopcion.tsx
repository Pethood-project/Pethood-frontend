/**
 * Mazo de tarjetas: arrastre horizontal para decidir y toque para abrir la ficha.
 *
 * La decisión se puede tomar de dos formas equivalentes: arrastrando la tarjeta o tocando
 * los botones de abajo. Los botones entran por el `ref` imperativo para que las dos rutas
 * ejecuten exactamente la misma animación de salida.
 *
 * El rechazo es temporal y vive acá: la mascota sale del mazo, pero no se persiste nada,
 * así que vuelve a aparecer la próxima vez que se recargue el feed.
 */
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { PublicacionFeed } from '@/services/publicaciones';

import { SelloDecision } from './SelloDecision';
import { TarjetaAdopcion } from './TarjetaAdopcion';

const ANCHO_PANTALLA = Dimensions.get('window').width;

/** Cuánto hay que arrastrar para que se tome la decisión al soltar. */
const UMBRAL_DISTANCIA = ANCHO_PANTALLA * 0.28;

/** Un movimiento corto pero rápido también decide: es el gesto natural de descarte. */
const UMBRAL_VELOCIDAD = 800;

/** Distancia a la que la tarjeta ya salió de pantalla, con margen para la rotación. */
const SALIDA = ANCHO_PANTALLA * 1.5;

const DURACION_SALIDA = 280;

/** Cuántas tarjetas del fondo se dibujan detrás de la de arriba. */
const TARJETAS_DE_FONDO = 2;

export type Decision = 'guardar' | 'rechazar';

interface TarjetaArrastrableRef {
  decidir: (decision: Decision) => void;
}

interface TarjetaArrastrableProps {
  publicacion: PublicacionFeed;
  onDecidir: (publicacion: PublicacionFeed, decision: Decision) => void;
  onAbrir: (publicacion: PublicacionFeed) => void;
}

/**
 * La tarjeta de arriba, la única que responde al dedo.
 *
 * El desplazamiento es suyo y no de la pila: la pila la monta con `key={publicacion.id}`,
 * así que cuando la mascota decidida sale del arreglo esta instancia se desmonta y la
 * siguiente nace en cero. Si el valor viviera en la pila habría que resetearlo a mano y la
 * tarjeta nueva aparecería un frame corrida, ya fuera de pantalla.
 */
const TarjetaArrastrable = forwardRef<TarjetaArrastrableRef, TarjetaArrastrableProps>(
  function TarjetaArrastrable({ publicacion, onDecidir, onAbrir }, ref) {
    const x = useSharedValue(0);
    const y = useSharedValue(0);

    // Mientras dura la animación de salida se ignoran gestos nuevos: sin esto, un segundo
    // swipe sobre la tarjeta que ya se está yendo dispararía dos decisiones.
    const decidiendo = useSharedValue(false);

    const estilo = useAnimatedStyle(() => ({
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        // La rotación acompaña el arrastre y hace que el gesto se sienta físico.
        {
          rotate: `${interpolate(x.value, [-ANCHO_PANTALLA, 0, ANCHO_PANTALLA], [-12, 0, 12])}deg`,
        },
      ],
    }));

    /** Salida animada + aviso a la pantalla. Es el único camino que ejecuta la decisión. */
    const volar = useCallback(
      (decision: Decision) => {
        'worklet';
        if (decidiendo.value) return;

        decidiendo.value = true;
        y.value = withTiming(0, { duration: DURACION_SALIDA });
        x.value = withTiming(
          decision === 'guardar' ? SALIDA : -SALIDA,
          { duration: DURACION_SALIDA },
          (terminada) => {
            if (terminada) scheduleOnRN(onDecidir, publicacion, decision);
          },
        );
      },
      [decidiendo, onDecidir, publicacion, x, y],
    );

    useImperativeHandle(ref, () => ({ decidir: volar }), [volar]);

    const arrastre = Gesture.Pan()
      .onUpdate((evento) => {
        if (decidiendo.value) return;
        x.value = evento.translationX;
        // El eje vertical se amortigua: el gesto que decide es el horizontal.
        y.value = evento.translationY * 0.2;
      })
      .onEnd((evento) => {
        if (decidiendo.value) return;

        const superaDistancia = Math.abs(evento.translationX) > UMBRAL_DISTANCIA;
        const superaVelocidad = Math.abs(evento.velocityX) > UMBRAL_VELOCIDAD;

        if (!superaDistancia && !superaVelocidad) {
          x.value = withSpring(0);
          y.value = withSpring(0);
          return;
        }

        // Con un flick rápido la dirección la manda la velocidad, no dónde quedó el dedo.
        const haciaLaDerecha = superaVelocidad ? evento.velocityX > 0 : evento.translationX > 0;
        volar(haciaLaDerecha ? 'guardar' : 'rechazar');
      });

    const toque = Gesture.Tap().onEnd((_evento, exitoso) => {
      if (exitoso && !decidiendo.value) scheduleOnRN(onAbrir, publicacion);
    });

    // `Race` y no `Simultaneous`: si el dedo se movió gana el arrastre, así un swipe no
    // termina abriendo la ficha por accidente.
    return (
      <GestureDetector gesture={Gesture.Race(arrastre, toque)}>
        <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
          <TarjetaAdopcion publicacion={publicacion} />
          <SelloDecision desplazamiento={x} umbral={UMBRAL_DISTANCIA} />
        </Animated.View>
      </GestureDetector>
    );
  },
);

/** Tarjeta del fondo: no recibe toques y se achica según su profundidad en el mazo. */
function TarjetaDeFondo({
  publicacion,
  profundidad,
}: {
  publicacion: PublicacionFeed;
  profundidad: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [{ scale: 1 - profundidad * 0.04 }, { translateY: profundidad * 10 }],
          opacity: 1 - profundidad * 0.3,
        },
      ]}
    >
      <TarjetaAdopcion publicacion={publicacion} />
    </View>
  );
}

export interface PilaAdopcionRef {
  /** Dispara la salida hacia la derecha, igual que un swipe right. */
  guardar: () => void;
  /** Dispara la salida hacia la izquierda, igual que un swipe left. */
  rechazar: () => void;
}

interface PilaAdopcionProps {
  publicaciones: PublicacionFeed[];
  onDecidir: (publicacion: PublicacionFeed, decision: Decision) => void;
  onAbrir: (publicacion: PublicacionFeed) => void;
}

export const PilaAdopcion = forwardRef<PilaAdopcionRef, PilaAdopcionProps>(function PilaAdopcion(
  { publicaciones, onDecidir, onAbrir },
  ref,
) {
  // Apunta siempre a la instancia montada de la tarjeta de arriba: al remontarse por el
  // cambio de `key`, React reasigna este ref solo.
  const tarjeta = useRef<TarjetaArrastrableRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      guardar: () => tarjeta.current?.decidir('guardar'),
      rechazar: () => tarjeta.current?.decidir('rechazar'),
    }),
    [],
  );

  const [primera, ...resto] = publicaciones;
  if (!primera) return null;

  return (
    <View className="flex-1">
      {/* De atrás hacia adelante, para que la primera del arreglo quede arriba de todo. */}
      {resto
        .slice(0, TARJETAS_DE_FONDO)
        .map((publicacion, indice) => ({ publicacion, profundidad: indice + 1 }))
        .reverse()
        .map(({ publicacion, profundidad }) => (
          <TarjetaDeFondo key={publicacion.id} publicacion={publicacion} profundidad={profundidad} />
        ))}

      <TarjetaArrastrable
        key={primera.id}
        ref={tarjeta}
        publicacion={primera}
        onDecidir={onDecidir}
        onAbrir={onAbrir}
      />
    </View>
  );
});
