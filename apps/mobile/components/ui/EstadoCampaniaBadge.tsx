/** Pastilla de estado de campaña, con el color de cada estado. */
import { Text, View } from 'react-native';

import { estiloDeEstadoCampania } from '../../constants/EstadosCampania';

export function EstadoCampaniaBadge({ estado }: { estado: string }) {
  const { fondo, texto, etiqueta } = estiloDeEstadoCampania(estado);

  return (
    <View className={`self-start rounded-full border px-2.5 py-1 ${fondo}`}>
      <Text className={`text-xs font-medium ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
