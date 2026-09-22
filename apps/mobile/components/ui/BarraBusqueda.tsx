/**
 * Barra de búsqueda de un listado (GUI-08 / GUI-31).
 *
 * No se compone sobre `TextField`: ese es un campo de formulario con label, mensaje de error
 * y `FormField` alrededor: nada de eso aplica acá, y agregarle un "modo búsqueda" le sumaría
 * props que ningún formulario usa.
 *
 * `deshabilitada` la deja visible pero sin interacción — es lo que pide HU-5.1 criterio 2
 * para el usuario sin conversaciones: el buscador se muestra, atenuado, no se oculta.
 *
 * Estilo del artboard 07/18 del diseño Organic (sobre 262px, ×1,33): fondo `neutral-100`,
 * borde `neutral-300`, radio 15 → 20, padding 8/11 → 11/15, lupa de 14 → 19 en `neutral-500`
 * y texto de 10.5 → 14.
 *
 * El artboard dibuja la barra **sólo en reposo**: no tiene estado deshabilitado, ni con
 * texto escrito, ni con el filtro corriendo. El botón de limpiar y el indicador de abajo no
 * salen de ahí, se diseñaron acorde: mismos tokens, mismo tamaño de ícono que la lupa y sin
 * agregar una sola fila de alto a la barra.
 */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { PALETA } from '@/constants/theme';

/**
 * Lado del cuadro que ocupa el ícono de la izquierda. Fijo para que cambiar la lupa por el
 * spinner no mueva el texto ni un píxel: el `ActivityIndicator` de RN no mide igual que un
 * `Ionicons` y además difiere entre plataformas.
 */
const LADO_ICONO = 19;

interface BarraBusquedaProps {
  placeholder: string;
  valor?: string;
  onCambiar?: (texto: string) => void;
  deshabilitada?: boolean;
  accessibilityLabel?: string;
  /**
   * Tope de caracteres. Va al `maxLength` nativo del input: el teclado deja de aceptar
   * teclas en el límite, en vez de recortar el texto después de haberlo mostrado.
   */
  maxLength?: number;
  /**
   * Muestra la cruz para vaciar el campo de un toque, cuando hay algo escrito. Sin esta
   * prop no aparece: un buscador que todavía no filtra nada no tiene qué limpiar.
   */
  onLimpiar?: () => void;
  /** Cambia la lupa por un spinner mientras el filtro está por aplicarse. */
  cargando?: boolean;
}

export function BarraBusqueda({
  placeholder,
  valor,
  onCambiar,
  deshabilitada = false,
  accessibilityLabel,
  maxLength,
  onLimpiar,
  cargando = false,
}: BarraBusquedaProps) {
  const mostrarLimpiar = !deshabilitada && onLimpiar !== undefined && (valor?.length ?? 0) > 0;

  return (
    <View
      // Deshabilitada no alcanza con `editable={false}`: eso corta el tipeo pero deja el
      // campo alcanzable por el foco. El criterio 1 de HU-5.3 pide que **impida el foco**,
      // así que el contenedor entero deja de recibir toques.
      pointerEvents={deshabilitada ? 'none' : 'auto'}
      className={`flex-row items-center gap-[9px] rounded-[20px] border border-organic-neutral-300 bg-organic-neutral-100 px-[15px] py-[11px] ${
        deshabilitada ? 'opacity-60' : ''
      }`}
    >
      <View
        style={{ width: LADO_ICONO, height: LADO_ICONO }}
        className="items-center justify-center"
      >
        {cargando ? (
          <ActivityIndicator size="small" color={PALETA.accent[600]} />
        ) : (
          <Ionicons name="search" size={LADO_ICONO} color={PALETA.neutral[500]} />
        )}
      </View>

      <TextInput
        // Se escribe sólo si alguien está escuchando los cambios. Así la barra tiene tres
        // estados sin una prop de más: atenuada y muerta (`deshabilitada`), con aspecto
        // normal pero inerte (sin `onCambiar`), y plenamente funcional cuando se le pasa
        // `onCambiar`.
        editable={!deshabilitada && onCambiar !== undefined}
        focusable={!deshabilitada}
        value={valor}
        onChangeText={onCambiar}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={PALETA.neutral[500]}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        // Un buscador no es un formulario: el nombre propio no se autocapitaliza ni se
        // autocorrige, o el teclado "arregla" lo que se está buscando.
        autoCapitalize="none"
        autoCorrect={false}
        // La tecla de acción cierra el teclado en vez de ofrecer "siguiente": el filtro ya
        // se aplicó solo mientras escribía, no hay nada que enviar.
        returnKeyType="search"
        className="flex-1 p-0 font-cuerpo text-[14px] text-organic-neutral-900"
      />

      {mostrarLimpiar ? (
        <Pressable
          onPress={onLimpiar}
          accessibilityRole="button"
          accessibilityLabel="Limpiar la búsqueda"
          // El ícono mide 18: el `hitSlop` le da el área de toque de 44 que pide cualquier
          // control táctil, sin agrandar el dibujo ni empujar el borde de la barra.
          hitSlop={13}
          className="active:opacity-60"
        >
          <Ionicons name="close-circle" size={18} color={PALETA.neutral[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}
