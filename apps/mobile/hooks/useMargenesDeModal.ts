/**
 * Márgenes de un `Modal` de pantalla completa con `statusBarTranslucent`, para que el
 * encabezado no quede debajo de la hora y la batería.
 *
 * Dentro de un `Modal` el `SafeAreaView` nativo no recibe los insets (es otra ventana), así que
 * el margen se pone a mano. En iOS alcanza con `useSafeAreaInsets`, pero en Android el inset
 * superior llegó en 0 dentro del modal y el encabezado de los filtros de mascotas perdidas
 * quedaba pisado por la barra de estado (visto en un teléfono el 2026-09-30). Con
 * `statusBarTranslucent` el modal dibuja siempre debajo de esa barra, así que en Android su
 * alto es el margen justo.
 */
import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useMargenesDeModal(): { arriba: number; abajo: number } {
  const insets = useSafeAreaInsets();

  return {
    arriba:
      Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight ?? 0) : insets.top,
    abajo: insets.bottom,
  };
}
