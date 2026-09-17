/**
 * Barrita que se desliza por el borde superior de la barra inferior y marca la pestaña
 * abierta.
 *
 * Se monta como `tabBarBackground`, o sea detrás de los botones: así no toca el layout de
 * las pestañas. Reemplazar los botones para dibujarla adentro les rompe el centrado de
 * ícono y label.
 *
 * La pestaña activa sale de la ruta y no del estado del navegador porque expo-router no
 * expone `useNavigationState`; `usePathname` es API pública y alcanza para esto.
 *
 * Al pasar por Adoptar la barrita queda tapada por el botón amarillo, que está por
 * delante. Es a propósito: el movimiento no se corta y ese botón ya tiene su propia señal
 * de activo.
 */
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PALETA } from '@/constants/theme';

/** En el mismo orden en que se declaran las pestañas en `(tabs)/_layout.tsx`. */
const RUTAS = ['/', '/mis-mascotas', '/adoptar', '/chat', '/perfil'];

const ANCHO_BARRITA = 30;
const ALTO_BARRITA = 3;

/** Medio alto hacia arriba: la barrita queda montada sobre la línea del borde superior. */
const DESPLAZAMIENTO_VERTICAL = -ALTO_BARRITA / 2;

const RESORTE = { damping: 18, stiffness: 170, mass: 0.6 };

export function IndicadorTabs() {
  const pathname = usePathname();
  const [ancho, setAncho] = useState(0);

  const x = useSharedValue(0);
  const visible = useSharedValue(0);

  const indice = Math.max(0, RUTAS.indexOf(pathname));

  useEffect(() => {
    if (ancho === 0) return;

    // Centro de la pestaña activa, menos media barrita.
    const destino = (ancho / RUTAS.length) * (indice + 0.5) - ANCHO_BARRITA / 2;

    if (visible.value === 0) {
      // Primer posicionamiento: aparece donde va. Animarlo la haría entrar deslizándose
      // desde el borde izquierdo cada vez que se monta la barra.
      x.value = destino;
      visible.value = withSpring(1, RESORTE);
      return;
    }

    x.value = withSpring(destino, RESORTE);
  }, [ancho, indice, x, visible]);

  const estilo = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      className="absolute inset-0"
      // Para que el medio alto que sobresale no se recorte: en Android un ViewGroup recorta
      // a los hijos que se salen de sus límites.
      style={{ overflow: 'visible' }}
      onLayout={(evento: LayoutChangeEvent) => setAncho(evento.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: DESPLAZAMIENTO_VERTICAL,
            left: 0,
            width: ANCHO_BARRITA,
            height: ALTO_BARRITA,
            borderRadius: ALTO_BARRITA,
            backgroundColor: PALETA.accent[600],
          },
          estilo,
        ]}
      />
    </View>
  );
}
