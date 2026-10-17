/** Pastilla de estado de solicitud, con el color que le corresponde a cada estado. */
import { Text, View } from 'react-native';
import { estiloDeEstadoSolicitud } from '../../constants/EstadosSolicitud';

export function EstadoSolicitudBadge({ estado }: { estado: string }) {
  const { fondo, texto, etiqueta } = estiloDeEstadoSolicitud(estado);

  return (
    <View className={`self-start rounded-full border px-3 py-1.5 ${fondo}`}>
      <Text className={`font-cuerpo-semi text-[13px] ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
