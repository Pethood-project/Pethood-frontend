/**
 * Para los modales con forma de tarjeta (reportar, reseña) cuyo único campo de texto va al
 * final de un `ScrollView`.
 *
 * Esos modales suben con el teclado con un `KeyboardAvoidingView`, y en un teléfono chico la
 * tarjeta ya no entra entera en lo que queda arriba: se achica y el `ScrollView` queda arriba
 * de todo, con el campo tapado por el pie de botones. `FormularioConTeclado` no sirve acá,
 * porque mide contra el teclado y el campo ya está por encima de él.
 *
 * Mientras el campo está enfocado, cada vez que el scroll cambia de alto (el teclado se abre
 * cuadro a cuadro) o de contenido (se agrega un renglón) baja hasta el final, donde está el
 * campo. Sin foco no hace nada: no le pelea el scroll al usuario.
 */
import { useCallback, useMemo, useRef } from 'react';
import type { ScrollViewInstance } from 'react-native';

export function useCampoAlFinalVisible() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const enfocado = useRef(false);

  const bajar = useCallback((): void => {
    // Sin animación: se llama en cada cuadro de la del teclado.
    if (enfocado.current) scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  return useMemo(
    () => ({
      scrollRef,
      propsScroll: { onLayout: bajar, onContentSizeChange: bajar },
      propsCampo: {
        onFocus: () => {
          enfocado.current = true;
        },
        onBlur: () => {
          enfocado.current = false;
        },
      },
    }),
    [bajar],
  );
}
