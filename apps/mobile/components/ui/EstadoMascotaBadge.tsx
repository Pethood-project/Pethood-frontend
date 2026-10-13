/** Pastilla de estado de mascota, con el color que le corresponde a cada estado. */
import { Text, View } from 'react-native';
import { estiloDeEstado } from '../../constants/EstadosMascota';

interface EstadoMascotaBadgeProps {
  estado: string;
  /**
   * `md` es más grande (letra y relleno); pantallas más densas como Favoritos la usan. `lg`
   * acompaña al nombre grande de la ficha de la publicación.
   */
  tamanio?: 'sm' | 'md' | 'lg';
  /** Solo para "Adoptado": distingue la que adoptó quien mira de la que adoptó otra persona. */
  adoptadaPorMi?: boolean;
  /**
   * Va encima de la foto de una tarjeta: pastilla blanca y sin borde, o amarilla si está en
   * tránsito, para que se lea sobre cualquier imagen.
   */
  sobreFoto?: boolean;
}

const RELLENOS = { sm: 'px-2.5 py-1', md: 'px-3 py-1.5', lg: 'px-3.5 py-1.5' };
const LETRAS = { sm: 'text-xs', md: 'text-sm', lg: 'text-[15px]' };

export function EstadoMascotaBadge({
  estado,
  tamanio = 'sm',
  adoptadaPorMi,
  sobreFoto = false,
}: EstadoMascotaBadgeProps) {
  const { fondo, texto, etiqueta } = estiloDeEstado(estado, adoptadaPorMi);
  const relleno = RELLENOS[tamanio];
  const letra = LETRAS[tamanio];

  if (sobreFoto) {
    const enTransito = estado === 'En_Transito';
    const colorTexto = enTransito
      ? 'text-organic-accent-900'
      : estado === 'Disponible'
        ? 'text-organic-neutral-900'
        : texto;

    return (
      <View
        className={`self-start rounded-full ${relleno} ${
          enTransito ? 'bg-organic-calido-amarillo' : 'bg-white/95'
        }`}
      >
        <Text className={`${letra} font-cuerpo-semi ${colorTexto}`}>{etiqueta}</Text>
      </View>
    );
  }

  return (
    <View className={`self-start rounded-full border ${relleno} ${fondo}`}>
      <Text className={`${letra} font-medium ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
