/** Pastilla de estado de mascota, con el color que le corresponde a cada estado. */
import { Text, View } from 'react-native';
import { estiloDeEstado } from '../../constants/EstadosMascota';

export function EstadoMascotaBadge({ estado }: { estado: string }) {
  const { fondo, texto, etiqueta } = estiloDeEstado(estado);

  return (
    <View className={`self-start rounded-full border px-2.5 py-1 ${fondo}`}>
      <Text className={`text-xs font-medium ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
