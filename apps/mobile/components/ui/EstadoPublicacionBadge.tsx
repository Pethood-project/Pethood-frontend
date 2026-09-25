/** Pastilla de estado de publicación (no de la mascota), con el color de cada estado. */
import { Text, View } from 'react-native';
import { estiloDeEstadoPublicacion } from '../../constants/EstadosPublicacion';

interface EstadoPublicacionBadgeProps {
  /** Nombre del catálogo: `Activa`, `Pausada`, `Finalizada`. */
  estado: string;
  /** `md` es más grande (letra y relleno), para grillas como "Mis publicaciones". */
  tamanio?: 'sm' | 'md';
}

export function EstadoPublicacionBadge({ estado, tamanio = 'sm' }: EstadoPublicacionBadgeProps) {
  const { fondo, texto, etiqueta } = estiloDeEstadoPublicacion(estado);
  const relleno = tamanio === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const letra = tamanio === 'md' ? 'text-sm' : 'text-xs';

  return (
    <View className={`self-start rounded-full border ${relleno} ${fondo}`}>
      <Text className={`${letra} font-medium ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
