/** Pastilla de estado de solicitud, con el color que le corresponde a cada estado. */
import { Text, View } from 'react-native';
import { estiloDeEstadoSolicitud, type VistaSolicitud } from '../../constants/EstadosSolicitud';

interface EstadoSolicitudBadgeProps {
  estado: string;
  /** Quién mira: el rótulo cambia ("Enviada" para quien pidió, "Por revisar" para quien recibe). */
  vista?: VistaSolicitud;
}

export function EstadoSolicitudBadge({ estado, vista = 'refugio' }: EstadoSolicitudBadgeProps) {
  const { fondo, texto, etiqueta } = estiloDeEstadoSolicitud(estado, vista);

  return (
    <View className={`self-start rounded-full border px-3 py-1.5 ${fondo}`}>
      <Text className={`font-cuerpo-semi text-[13px] ${texto}`}>{etiqueta}</Text>
    </View>
  );
}
