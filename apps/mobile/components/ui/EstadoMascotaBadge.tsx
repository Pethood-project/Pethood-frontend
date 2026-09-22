/** Pastilla de estado de mascota, con el color que le corresponde a cada estado. */
import { Text, View } from 'react-native';
import { estiloDeEstado } from '../../constants/EstadosMascota';

interface EstadoMascotaBadgeProps {
  estado: string;
  /** `md` es más grande (letra y relleno); pantallas más densas como Favoritos la usan. */
  tamanio?: 'sm' | 'md';
}

export function EstadoMascotaBadge({ estado, tamanio = 'sm' }: EstadoMascotaBadgeProps) {
  const { fondo, texto, etiqueta } = estiloDeEstado(estado);
  const relleno = tamanio === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const letra = tamanio === 'md' ? 'text-sm' : 'text-xs';

  return (
    <View className={`self-start rounded-full border ${relleno} ${fondo}`}>
      <Text className={`${letra} font-medium ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
