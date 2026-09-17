/**
 * Barra de búsqueda de un listado (GUI-08 / GUI-31).
 *
 * No se compone sobre `TextField`: ese es un campo de formulario con label, mensaje de error
 * y `FormField` alrededor: nada de eso aplica acá, y agregarle un "modo búsqueda" le sumaría
 * props que ningún formulario usa.
 *
 * `deshabilitada` la deja visible pero sin interacción — es lo que pide HU-5.1 criterio 2
 * para el usuario sin conversaciones: el buscador se muestra, atenuado, no se oculta.
 */
import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import { PALETA } from '@/constants/theme';

interface BarraBusquedaProps {
  placeholder: string;
  valor?: string;
  onCambiar?: (texto: string) => void;
  deshabilitada?: boolean;
  accessibilityLabel?: string;
}

export function BarraBusqueda({
  placeholder,
  valor,
  onCambiar,
  deshabilitada = false,
  accessibilityLabel,
}: BarraBusquedaProps) {
  return (
    <View
      className={`flex-row items-center gap-2 rounded-xl border border-organic-neutral-200 bg-white px-3 py-2.5 ${
        deshabilitada ? 'opacity-60' : ''
      }`}
    >
      <Ionicons name="search" size={18} color={PALETA.neutral[400]} />

      <TextInput
        // Se escribe sólo si alguien está escuchando los cambios. Así la barra tiene tres
        // estados sin una prop de más: atenuada y muerta (`deshabilitada`), con aspecto
        // normal pero inerte (sin `onCambiar`, que es lo que necesita HU-5.1 mientras el
        // filtrado siga siendo HU-5.3), y plenamente funcional cuando se le pasa `onCambiar`.
        editable={!deshabilitada && onCambiar !== undefined}
        value={valor}
        onChangeText={onCambiar}
        placeholder={placeholder}
        placeholderTextColor={PALETA.neutral[400]}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        className="flex-1 p-0 text-sm text-organic-neutral-900"
      />
    </View>
  );
}
