/**
 * Cómo se ve el tipo de una solicitud —adopción o tránsito— en el detalle y en el listado: una
 * pastilla con ícono y borde marcado, de colores distintos para cada uno, que no se confunde con
 * el estado.
 */
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ESTILO_TIPO_SOLICITUD } from '@/constants/Solicitudes';
import type { TipoSolicitud } from '@/services/solicitudes';

export function EtiquetaTipoSolicitud({ tipo }: { tipo: string }) {
  const estilo = ESTILO_TIPO_SOLICITUD[tipo as TipoSolicitud] ?? ESTILO_TIPO_SOLICITUD.Adopcion;

  return (
    <View
      style={{ backgroundColor: estilo.fondo, borderColor: estilo.tinta }}
      className="flex-row items-center gap-1.5 self-start rounded-full border-[1.5px] px-3 py-1"
    >
      <Ionicons name={estilo.icono} size={14} color={estilo.tinta} />
      <Text style={{ color: estilo.tinta }} className="font-cuerpo-bold text-[13px]">
        {tipo === 'Transito' ? 'Tránsito' : 'Adopción'}
      </Text>
    </View>
  );
}
